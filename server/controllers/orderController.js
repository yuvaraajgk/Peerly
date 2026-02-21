const { supabase } = require('../config/db')

exports.createOrder = async (req, res) => {
  try {
    const { itemId, transactionType, rentalDays, paymentMethod } = req.body
    const buyerId = req.user.user_id

    // Fetch item details using Supabase
    const { data: itemData, error: itemError } = await supabase
      .from('items')
      .select('*')
      .eq('item_id', itemId)
      .eq('status', 'Available')
      .single()

    if (itemError || !itemData) {
      return res.status(404).json({ message: 'Item not available' })
    }

    // Validate transaction type
    if (transactionType === 'Purchase' && !itemData.is_for_sale) {
      return res.status(400).json({ message: 'Item is not for sale' })
    }

    if (transactionType === 'Rental' && !itemData.is_for_rent) {
      return res.status(400).json({ message: 'Item is not for rent' })
    }

    // Calculate total amount
    let totalAmount = 0
    let rentalStartDate = null
    let rentalEndDate = null

    if (transactionType === 'Purchase') {
      totalAmount = parseFloat(itemData.price_sale)
    } else if (transactionType === 'Rental') {
      if (!rentalDays || rentalDays < 1) {
        return res.status(400).json({ message: 'Valid rental days required' })
      }
      totalAmount = parseFloat(itemData.price_rent_daily) * rentalDays
      rentalStartDate = new Date().toISOString().split('T')[0]
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + rentalDays - 1)
      rentalEndDate = endDate.toISOString().split('T')[0]
    }

    // Handle payment - cash only
    let paymentStatus = 'Pending'

    // Create transaction using Supabase
    const { data: transactionData, error: transactionError } = await supabase
      .from('transactions')
      .insert({
        buyer_id: buyerId,
        item_id: itemId,
        transaction_type: transactionType,
        quantity: transactionType === 'Rental' ? rentalDays : 1,
        total_amount: totalAmount,
        payment_method: paymentMethod,
        payment_status: paymentStatus,
        rental_start_date: rentalStartDate,
        rental_end_date: rentalEndDate,
      })
      .select()
      .single()

    if (transactionError) {
      console.error('Supabase transaction insert error:', transactionError)
      return res.status(500).json({ message: 'Failed to create order' })
    }

    res.status(201).json({
      transaction: {
        transactionId: transactionData.transaction_id,
        itemId: transactionData.item_id,
        transactionType: transactionData.transaction_type,
        totalAmount: parseFloat(transactionData.total_amount),
        paymentMethod: transactionData.payment_method,
        paymentStatus: transactionData.payment_status,
        rentalStartDate: transactionData.rental_start_date,
        rentalEndDate: transactionData.rental_end_date,
      },
    })
  } catch (error) {
    console.error('Create order error:', error)
    res.status(500).json({ message: 'Failed to create order' })
  }
}


exports.getMyOrders = async (req, res) => {
  try {
    const buyerId = req.user.user_id

    // Fetch transactions with related data using Supabase
    const { data: transactionsData, error: transactionsError } = await supabase
      .from('transactions')
      .select(`
        *,
        items:item_id (
          title,
          price_sale,
          price_rent_daily,
          seller_id,
          users:seller_id (
            display_name
          ),
          item_images (
            image_url,
            sort_order
          )
        )
      `)
      .eq('buyer_id', buyerId)
      .order('created_at', { ascending: false })

    if (transactionsError) {
      console.error('Supabase get orders error:', transactionsError)
      return res.status(500).json({ message: 'Failed to fetch orders' })
    }

    // Transform data
    const orders = (transactionsData || []).map((transaction) => {
      const item = Array.isArray(transaction.items) ? transaction.items[0] : transaction.items
      const seller = Array.isArray(item?.users) ? item.users[0] : item?.users
      const images = Array.isArray(item?.item_images) ? item.item_images : []
      const thumbnail = images.length > 0
        ? images.sort((a, b) => a.sort_order - b.sort_order)[0]?.image_url
        : null

      return {
        transactionId: transaction.transaction_id,
        itemId: transaction.item_id,
        title: item?.title || null,
        transactionType: transaction.transaction_type,
        quantity: transaction.quantity,
        totalAmount: parseFloat(transaction.total_amount),
        paymentMethod: transaction.payment_method,
        paymentStatus: transaction.payment_status,
        transactionStatus: transaction.transaction_status,
        rentalStartDate: transaction.rental_start_date,
        rentalEndDate: transaction.rental_end_date,
        createdAt: transaction.created_at,
        thumbnail,
        sellerName: seller?.display_name || null,
      }
    })

    res.json({ orders })
  } catch (error) {
    console.error('Get my orders error:', error)
    res.status(500).json({ message: 'Failed to fetch orders' })
  }
}

exports.deleteOrder = async (req, res) => {
  try {
    const { id } = req.params
    const buyerId = req.user.user_id

    // Verify transaction exists and user is the buyer
    const { data: transactionData, error: fetchError } = await supabase
      .from('transactions')
      .select('buyer_id')
      .eq('transaction_id', id)
      .single()

    if (fetchError || !transactionData) {
      return res.status(404).json({ message: 'Order not found' })
    }

    // Only buyer can delete their own order
    if (transactionData.buyer_id !== buyerId) {
      return res.status(403).json({ message: 'Not authorized' })
    }

    // Delete transaction using Supabase
    const { error: deleteError } = await supabase
      .from('transactions')
      .delete()
      .eq('transaction_id', id)

    if (deleteError) {
      console.error('Supabase delete error:', deleteError)
      return res.status(500).json({ message: 'Failed to delete order' })
    }

    res.json({ message: 'Order removed from wishlist' })
  } catch (error) {
    console.error('Delete order error:', error)
    res.status(500).json({ message: 'Failed to delete order' })
  }
}

exports.updateTransactionStatus = async (req, res) => {
  try {
    const { id } = req.params
    const { transactionStatus } = req.body

    // Verify transaction exists and user is seller using Supabase
    const { data: transactionData, error: fetchError } = await supabase
      .from('transactions')
      .select(`
        *,
        items:item_id (
          seller_id,
          transaction_type
        )
      `)
      .eq('transaction_id', id)
      .single()

    if (fetchError || !transactionData) {
      return res.status(404).json({ message: 'Transaction not found' })
    }

    const item = Array.isArray(transactionData.items) ? transactionData.items[0] : transactionData.items

    // Only seller can update status
    if (item.seller_id !== req.user.user_id) {
      return res.status(403).json({ message: 'Not authorized' })
    }

    // Update transaction status using Supabase
    const { error: updateError } = await supabase
      .from('transactions')
      .update({ transaction_status: transactionStatus })
      .eq('transaction_id', id)

    if (updateError) {
      console.error('Supabase update error:', updateError)
      return res.status(500).json({ message: 'Failed to update transaction status' })
    }

    // If completed, ensure item status is updated
    if (transactionStatus === 'Completed') {
      const status = item.transaction_type === 'Rental' ? 'Rented' : 'Sold'
      await supabase
        .from('items')
        .update({ status })
        .eq('item_id', transactionData.item_id)
    }

    res.json({ message: 'Transaction status updated' })
  } catch (error) {
    console.error('Update transaction status error:', error)
    res.status(500).json({ message: 'Failed to update transaction status' })
  }
}
