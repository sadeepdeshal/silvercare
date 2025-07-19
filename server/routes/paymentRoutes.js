const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const jwt = require('jsonwebtoken');

// Authentication middleware
const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Authorization token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('Authentication error:', err);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Create payment intent - CLEAN VERSION WITHOUT statement_descriptor
router.post('/create-payment-intent', authenticate, async (req, res) => {
  try {
    const { amount, currency = 'lkr', bookingData, billingDetails } = req.body;

    console.log('Creating payment intent for:', {
      amount,
      currency,
      user: req.user.userId,
      bookingData
    });

    // Validate required fields
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid amount'
      });
    }

    if (!bookingData || !billingDetails) {
      return res.status(400).json({
        success: false,
        error: 'Missing booking data or billing details'
      });
    }

    // Create payment intent - MINIMAL VERSION TO AVOID ERRORS
    const paymentIntentData = {
      amount: Math.round(amount), // Convert to cents/paisa
      currency: 'lkr',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        tempBookingId: String(bookingData.tempBookingId || ''),
        elderId: String(bookingData.elderId || ''),
        doctorId: String(bookingData.doctorId || ''),
        appointmentDate: String(bookingData.appointmentDate || ''),
        appointmentTime: String(bookingData.appointmentTime || ''),
        appointmentType: String(bookingData.appointmentType || ''),
        customerName: String(billingDetails.name || ''),
        customerEmail: String(billingDetails.email || ''),
        platform: 'SilverCare',
        familyMemberId: String(req.user.userId || ''),
      },
      description: `SilverCare Appointment - ${bookingData.doctorName || 'Doctor'}`,
    };

    // Add receipt_email only if email is provided and valid
    if (billingDetails.email && billingDetails.email.includes('@')) {
      paymentIntentData.receipt_email = billingDetails.email;
    }

    // IMPORTANT: DO NOT ADD statement_descriptor - it's not supported for LKR
    // IMPORTANT: DO NOT ADD statement_descriptor_suffix - it's not needed

    console.log('Creating Stripe payment intent with clean data:', {
      amount: paymentIntentData.amount,
      currency: paymentIntentData.currency,
      description: paymentIntentData.description,
      metadataKeys: Object.keys(paymentIntentData.metadata)
    });

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentData);

    console.log('Payment intent created successfully:', paymentIntent.id);

    res.json({
      success: true,
      client_secret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.id
    });

  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to create payment intent',
      details: error.message
    });
  }
});

// Get payment intent status
router.get('/payment-intent/:paymentIntentId', authenticate, async (req, res) => {
  try {
    const { paymentIntentId } = req.params;

    console.log('Retrieving payment intent:', paymentIntentId);

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    res.json({
      success: true,
      status: paymentIntent.status,
      payment_intent: paymentIntent
    });

  } catch (error) {
    console.error('Error retrieving payment intent:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to retrieve payment intent',
      details: error.message
    });
  }
});

module.exports = router;
