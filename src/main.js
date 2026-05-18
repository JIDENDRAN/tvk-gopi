import './style.css'
import { createIcons, Cpu, Layout, Smartphone, Users2, ClipboardList, MessageSquareMore, ShieldCheck, Clock, Target, Eye, Users, PhoneCall, Globe, MapPin, MessageSquarePlus, CheckCircle2, HandMetal, BrainCircuit, Shield, Quote, ArrowRight } from 'lucide'

// Initialize Lucide Icons
createIcons({
  icons: {
    Cpu,
    Layout,
    Smartphone,
    Users2,
    ClipboardList,
    MessageSquareMore,
    ShieldCheck,
    Clock,
    Target,
    Eye,
    Users,
    PhoneCall,
    Globe,
    MapPin,
    MessageSquarePlus,
    CheckCircle2,
    HandMetal,
    BrainCircuit,
    Shield,
    Quote,
    ArrowRight
  }
})

// Set Hero Image
document.getElementById('hero-image').src = '/Vijay-Political-Party.webp'

// Header Scroll Effect
const header = document.querySelector('header')
window.addEventListener('scroll', () => {
  if (window.scrollY > 50) {
    header.classList.add('scrolled')
  } else {
    header.classList.remove('scrolled')
  }
})

// Reveal Animations on Scroll
const revealElements = document.querySelectorAll('[data-reveal]')
const revealOnScroll = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('active')
    }
  })
}, {
  threshold: 0.1
})

revealElements.forEach(el => revealOnScroll.observe(el))

// Smooth Scroll for Internal Links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault()
    document.querySelector(this.getAttribute('href')).scrollIntoView({
      behavior: 'smooth'
    })
  })
})

// Grievance Form Handling
const API_BASE = import.meta.env.VITE_API_BASE || '';

const grievanceForm = document.getElementById('grievance-form')
const formSuccess = document.getElementById('form-success')

if (grievanceForm) {
  grievanceForm.addEventListener('submit', async (e) => {
    e.preventDefault()

    const submitBtn = document.getElementById('submit-btn')
    const originalText = submitBtn.innerHTML
    
    // UI Feedback
    submitBtn.innerHTML = '<span class="tamil-text">சமர்ப்பிக்கிறது...</span> | Submitting...'
    submitBtn.disabled = true

    // Gather Form Data
    const name = document.getElementById('citizen-name').value.trim()
    const phone = document.getElementById('citizen-phone').value.trim()
    const constituency = document.getElementById('citizen-constituency').value.trim()
    const category = document.getElementById('citizen-category').value
    const description = document.getElementById('citizen-description').value.trim()

    try {
      const response = await fetch(`${API_BASE}/api/grievances`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, constituency, category, description })
      })

      const result = await response.json()

      if (result.success) {
        // Update the Tracking ID on success screen
        const successTrackId = document.getElementById('success-track-id')
        if (successTrackId) {
          successTrackId.textContent = result.trackId
        }
        
        // Switch view states
        grievanceForm.style.display = 'none'
        formSuccess.style.display = 'block'
        formSuccess.scrollIntoView({ behavior: 'smooth', block: 'center' })
      } else {
        alert('Problem submitting grievance: ' + (result.message || 'Unknown error'))
        submitBtn.innerHTML = originalText
        submitBtn.disabled = false
      }
    } catch (error) {
      console.error('Error submitting form:', error)
      alert('Unable to submit your request at this time. Please make sure the backend server is running.')
      submitBtn.innerHTML = originalText
      submitBtn.disabled = false
    }
  })
}

