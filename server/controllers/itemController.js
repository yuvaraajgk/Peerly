const { supabase } = require('../config/db')
const multer = require('multer')
const path = require('path')
const fs = require('fs')

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads')
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(null, 'item-' + uniqueSuffix + path.extname(file.originalname))
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
    const mimetype = allowedTypes.test(file.mimetype)
    if (extname && mimetype) {
      cb(null, true)
    } else {
      cb(new Error('Only image files are allowed (jpeg, jpg, png, gif)'))
    }
  },
})

exports.uploadImages = upload.array('images', 5)

exports.createItem = async (req, res) => {
  try {
    const {
      title,
      description,
      categoryId,
      condition,
      itemAge,
      priceSale,
      priceRentDaily,
      isForSale,
      isForRent,
    } = req.body

    const sellerId = req.user.user_id

    // Convert string booleans to actual booleans (FormData sends strings)
    const isForSaleBool = isForSale === 'true' || isForSale === true
    const isForRentBool = isForRent === 'true' || isForRent === true

    // Validate that at least one transaction type is selected
    if (!isForSaleBool && !isForRentBool) {
      return res.status(400).json({ message: 'Item must be for sale or rent' })
    }

    // Validate pricing - only check the selected transaction type
    if (isForSaleBool && (!priceSale || parseFloat(priceSale) <= 0)) {
      return res.status(400).json({ message: 'Sale price required' })
    }
    if (isForRentBool && (!priceRentDaily || parseFloat(priceRentDaily) <= 0)) {
      return res.status(400).json({ message: 'Daily rental price required' })
    }

    // Create item using Supabase
    const { data: newItem, error: itemError } = await supabase
      .from('items')
      .insert({
        seller_id: sellerId,
        category_id: parseInt(categoryId),
        title,
        description: description || null,
        condition,
        item_age: itemAge || null,
        price_sale: isForSaleBool ? parseFloat(priceSale) : null,
        price_rent_daily: isForRentBool ? parseFloat(priceRentDaily) : null,
        is_for_sale: isForSaleBool,
        is_for_rent: isForRentBool,
      })
      .select()
      .single()

    if (itemError) {
      console.error('Supabase item insert error:', itemError)
      return res.status(500).json({ message: 'Failed to create item' })
    }

    // Handle image uploads
    if (req.files && req.files.length > 0) {
      const imageInserts = req.files.map((file, index) => ({
        item_id: newItem.item_id,
        image_url: `/uploads/${file.filename}`,
        sort_order: index + 1,
      }))

      const { error: imageError } = await supabase
        .from('item_images')
        .insert(imageInserts)

      if (imageError) {
        console.error('Supabase image insert error:', imageError)
        // Continue anyway, item is created
      }
    }

    // Fetch complete item with images
    const completeItem = await exports.getItemById(newItem.item_id)

    res.status(201).json({ item: completeItem })
  } catch (error) {
    console.error('Create item error:', error)
    res.status(500).json({ message: 'Failed to create item' })
  }
}

exports.getItemById = async (itemId) => {
  try {
    // Fetch item with category and seller info
    const { data: items, error: itemError } = await supabase
      .from('items')
      .select(`
        *,
        categories:category_id (
          category_name,
          slug
        ),
        users:seller_id (
          display_name,
          college_email
        )
      `)
      .eq('item_id', itemId)
      .single()

    if (itemError || !items) {
      return null
    }

    // Fetch images separately
    const { data: images, error: imageError } = await supabase
      .from('item_images')
      .select('image_id, image_url, sort_order')
      .eq('item_id', itemId)
      .order('sort_order', { ascending: true })

    const category = Array.isArray(items.categories) ? items.categories[0] : items.categories
    const seller = Array.isArray(items.users) ? items.users[0] : items.users

    return {
      itemId: items.item_id,
      sellerId: items.seller_id,
      categoryId: items.category_id,
      categoryName: category?.category_name || null,
      categorySlug: category?.slug || null,
      title: items.title,
      description: items.description,
      condition: items.condition,
      itemAge: items.item_age,
      priceSale: items.price_sale ? parseFloat(items.price_sale) : null,
      priceRentDaily: items.price_rent_daily ? parseFloat(items.price_rent_daily) : null,
      isForSale: items.is_for_sale,
      isForRent: items.is_for_rent,
      status: items.status,
      createdAt: items.created_at,
      sellerName: seller?.display_name || null,
      images: (images || []).map((img) => ({
        imageId: img.image_id,
        imageUrl: img.image_url,
        sortOrder: img.sort_order,
      })),
    }
  } catch (error) {
    console.error('Get item by ID error:', error)
    return null
  }
}

exports.getItems = async (req, res) => {
  try {
    const { category, status, search, page = 1, limit = 20 } = req.query
    const offset = (page - 1) * limit

    // Build Supabase query
    let query = supabase
      .from('items')
      .select(`
        *,
        categories:category_id (
          category_name,
          slug
        ),
        users:seller_id (
          display_name
        ),
        item_images (
          image_url,
          sort_order
        )
      `)
      .eq('status', status || 'Available')
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1)

    // Apply category filter
    if (category) {
      // First get category ID
      const { data: categoryData } = await supabase
        .from('categories')
        .select('category_id')
        .eq('slug', category)
        .single()

      if (categoryData) {
        query = query.eq('category_id', categoryData.category_id)
      }
    }

    // Apply search filter
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    const { data: itemsData, error } = await query

    if (error) {
      console.error('Supabase get items error:', error)
      return res.status(500).json({ message: 'Failed to fetch items' })
    }

    // Transform data to match expected format
    const items = (itemsData || []).map((item) => {
      const category = Array.isArray(item.categories) ? item.categories[0] : item.categories
      const seller = Array.isArray(item.users) ? item.users[0] : item.users
      const images = Array.isArray(item.item_images) ? item.item_images : []
      const thumbnail = images.length > 0 
        ? images.sort((a, b) => a.sort_order - b.sort_order)[0]?.image_url 
        : null

      return {
        itemId: item.item_id,
        sellerId: item.seller_id,
        categoryId: item.category_id,
        categoryName: category?.category_name || null,
        categorySlug: category?.slug || null,
        title: item.title,
        description: item.description,
        condition: item.condition,
        itemAge: item.item_age,
        priceSale: item.price_sale ? parseFloat(item.price_sale) : null,
        priceRentDaily: item.price_rent_daily ? parseFloat(item.price_rent_daily) : null,
        isForSale: item.is_for_sale,
        isForRent: item.is_for_rent,
        status: item.status,
        createdAt: item.created_at,
        sellerName: seller?.display_name || null,
        thumbnail,
      }
    })

    res.json({ items })
  } catch (error) {
    console.error('Get items error:', error)
    res.status(500).json({ message: 'Failed to fetch items' })
  }
}

exports.getItem = async (req, res) => {
  try {
    const { id } = req.params
    const item = await exports.getItemById(id)

    if (!item) {
      return res.status(404).json({ message: 'Item not found' })
    }

    res.json({ item })
  } catch (error) {
    console.error('Get item error:', error)
    res.status(500).json({ message: 'Failed to fetch item' })
  }
}

exports.getMyListings = async (req, res) => {
  try {
    const sellerId = req.user.user_id

    const { data: itemsData, error } = await supabase
      .from('items')
      .select(`
        *,
        categories:category_id (
          category_name
        ),
        item_images (
          image_url,
          sort_order
        )
      `)
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase get my listings error:', error)
      return res.status(500).json({ message: 'Failed to fetch listings' })
    }

    const items = (itemsData || []).map((item) => {
      const category = Array.isArray(item.categories) ? item.categories[0] : item.categories
      const images = Array.isArray(item.item_images) ? item.item_images : []
      const thumbnail = images.length > 0 
        ? images.sort((a, b) => a.sort_order - b.sort_order)[0]?.image_url 
        : null

      return {
        itemId: item.item_id,
        categoryId: item.category_id,
        categoryName: category?.category_name || null,
        title: item.title,
        description: item.description,
        condition: item.condition,
        itemAge: item.item_age,
        priceSale: item.price_sale ? parseFloat(item.price_sale) : null,
        priceRentDaily: item.price_rent_daily ? parseFloat(item.price_rent_daily) : null,
        isForSale: item.is_for_sale,
        isForRent: item.is_for_rent,
        status: item.status,
        createdAt: item.created_at,
        thumbnail,
      }
    })

    res.json({ items })
  } catch (error) {
    console.error('Get my listings error:', error)
    res.status(500).json({ message: 'Failed to fetch listings' })
  }
}

exports.updateItemStatus = async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body
    const sellerId = req.user.user_id

    // Verify ownership using Supabase
    const { data: itemData, error: checkError } = await supabase
      .from('items')
      .select('seller_id')
      .eq('item_id', id)
      .single()

    if (checkError || !itemData) {
      return res.status(404).json({ message: 'Item not found' })
    }

    if (itemData.seller_id !== sellerId) {
      return res.status(403).json({ message: 'Not authorized' })
    }

    // Update status using Supabase
    const { error: updateError } = await supabase
      .from('items')
      .update({ status })
      .eq('item_id', id)

    if (updateError) {
      console.error('Supabase update error:', updateError)
      return res.status(500).json({ message: 'Failed to update item status' })
    }

    const updatedItem = await exports.getItemById(id)
    res.json({ item: updatedItem })
  } catch (error) {
    console.error('Update item status error:', error)
    res.status(500).json({ message: 'Failed to update item status' })
  }
}

exports.updateItem = async (req, res) => {
  try {
    const { id } = req.params
    const {
      title,
      description,
      categoryId,
      condition,
      itemAge,
      priceSale,
      priceRentDaily,
      isForSale,
      isForRent,
    } = req.body

    const sellerId = req.user.user_id

    // Verify ownership using Supabase
    const { data: itemData, error: checkError } = await supabase
      .from('items')
      .select('seller_id')
      .eq('item_id', id)
      .single()

    if (checkError || !itemData) {
      return res.status(404).json({ message: 'Item not found' })
    }

    if (itemData.seller_id !== sellerId) {
      return res.status(403).json({ message: 'Not authorized' })
    }

    // Convert string booleans to actual booleans (FormData sends strings)
    const isForSaleBool = isForSale === 'true' || isForSale === true
    const isForRentBool = isForRent === 'true' || isForRent === true

    // Update item using Supabase
    const updateData = {
      title,
      description: description || null,
      category_id: parseInt(categoryId),
      condition: condition || null,
      item_age: itemAge || null,
      price_sale: isForSaleBool ? parseFloat(priceSale) : null,
      price_rent_daily: isForRentBool ? parseFloat(priceRentDaily) : null,
      is_for_rent: isForRentBool,
      is_for_sale: isForSaleBool,
    }

    const { error: updateError } = await supabase
      .from('items')
      .update(updateData)
      .eq('item_id', id)

    if (updateError) {
      console.error('Supabase update error:', updateError)
      return res.status(500).json({ message: 'Failed to update item' })
    }

    // Handle image uploads if new images are provided
    // Note: If new images are uploaded, they replace all existing images
    // If no new images are uploaded, existing images are kept
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      // Delete old images
      await supabase.from('item_images').delete().eq('item_id', id)

      // Insert new images
      const imageInserts = req.files.map((file, index) => ({
        item_id: id,
        image_url: `/uploads/${file.filename}`,
        sort_order: index + 1,
      }))

      const { error: imageError } = await supabase
        .from('item_images')
        .insert(imageInserts)

      if (imageError) {
        console.error('Supabase image insert error:', imageError)
        // Continue anyway, item is updated
      }
    }

    // Fetch updated item
    const updatedItem = await exports.getItemById(id)
    res.json({ item: updatedItem, message: 'Item updated successfully' })
  } catch (error) {
    console.error('Update item error:', error)
    res.status(500).json({ message: 'Failed to update item' })
  }
}

exports.getCategories = async (req, res) => {
  try {
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .order('category_name', { ascending: true })

    if (error) {
      console.error('Supabase get categories error:', error)
      return res.status(500).json({ message: 'Failed to fetch categories' })
    }

    res.json({ categories: categories || [] })
  } catch (error) {
    console.error('Get categories error:', error)
    res.status(500).json({ message: 'Failed to fetch categories' })
  }
}
