/**
 * ReviewModal component for collecting league feedback
 * Displays a form with various questions about the league experience
 */

'use client'

import { useState } from 'react'
import { X, Star } from 'lucide-react'

interface ReviewModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ReviewModal({ isOpen, onClose }: ReviewModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    overallRating: 0,
    organizationRating: 0,
    facilitiesRating: 0,
    communicationRating: 0,
    valueRating: 0,
    favoriteAspect: '',
    improvements: '',
    wouldRecommend: '',
    additionalComments: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  if (!isOpen) return null

  const handleRatingClick = (field: string, rating: number) => {
    setFormData(prev => ({ ...prev, [field]: rating }))
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // TODO: Send form data to your backend/database
      // For now, just log it
      console.log('Review submitted:', formData)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setSubmitSuccess(true)
      
      // Reset form after 2 seconds and close modal
      setTimeout(() => {
        setFormData({
          name: '',
          email: '',
          overallRating: 0,
          organizationRating: 0,
          facilitiesRating: 0,
          communicationRating: 0,
          valueRating: 0,
          favoriteAspect: '',
          improvements: '',
          wouldRecommend: '',
          additionalComments: ''
        })
        setSubmitSuccess(false)
        onClose()
      }, 2000)
    } catch (error) {
      console.error('Error submitting review:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const StarRating = ({ rating, onRate, label }: { rating: number; onRate: (rating: number) => void; label: string }) => (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-200 mb-2">{label}</label>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onRate(star)}
            className="transition-transform hover:scale-110"
            aria-label={`Rate ${star} stars`}
          >
            <Star
              size={32}
              className={star <= rating ? 'fill-[#FFD700] text-[#FFD700]' : 'text-gray-500'}
            />
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onClick={onClose}>
      <div
        className="bg-[#1a1a1a] border border-[#333333] rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-[#1a1a1a] border-b border-[#333333] p-6 flex items-center justify-between">
          <h2 className="text-2xl font-black text-[#D47F7D]">Review YM JAX Soccer League</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#2a2a2a] rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X size={24} className="text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {submitSuccess ? (
            <div className="text-center py-12">
              <div className="mb-4">
                <Star size={64} className="mx-auto fill-[#FFD700] text-[#FFD700]" />
              </div>
              <h3 className="text-2xl font-bold text-[#D47F7D] mb-2">Thank You!</h3>
              <p className="text-gray-300">Your review has been submitted successfully.</p>
            </div>
          ) : (
            <>
              {/* Contact Information */}
              <div className="mb-8">
                <h3 className="text-lg font-bold text-white mb-4">Contact Information</h3>
                
                <div className="mb-4">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-200 mb-2">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#333333] rounded-lg text-white focus:outline-none focus:border-[#D47F7D]"
                    placeholder="Your name"
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-200 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#333333] rounded-lg text-white focus:outline-none focus:border-[#D47F7D]"
                    placeholder="your.email@example.com"
                  />
                </div>
              </div>

              {/* Ratings */}
              <div className="mb-8">
                <h3 className="text-lg font-bold text-white mb-4">Rate Your Experience</h3>
                
                <StarRating
                  rating={formData.overallRating}
                  onRate={(rating) => handleRatingClick('overallRating', rating)}
                  label="Overall Experience *"
                />

                <StarRating
                  rating={formData.organizationRating}
                  onRate={(rating) => handleRatingClick('organizationRating', rating)}
                  label="League Organization *"
                />

                <StarRating
                  rating={formData.facilitiesRating}
                  onRate={(rating) => handleRatingClick('facilitiesRating', rating)}
                  label="Facilities & Venue *"
                />

                <StarRating
                  rating={formData.communicationRating}
                  onRate={(rating) => handleRatingClick('communicationRating', rating)}
                  label="Communication *"
                />

                <StarRating
                  rating={formData.valueRating}
                  onRate={(rating) => handleRatingClick('valueRating', rating)}
                  label="Value for Money *"
                />
              </div>

              {/* Open-ended Questions */}
              <div className="mb-8">
                <h3 className="text-lg font-bold text-white mb-4">Tell Us More</h3>

                <div className="mb-4">
                  <label htmlFor="favoriteAspect" className="block text-sm font-medium text-gray-200 mb-2">
                    What was your favorite aspect of the league?
                  </label>
                  <textarea
                    id="favoriteAspect"
                    name="favoriteAspect"
                    value={formData.favoriteAspect}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#333333] rounded-lg text-white focus:outline-none focus:border-[#D47F7D]"
                    placeholder="Share what you enjoyed most..."
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="improvements" className="block text-sm font-medium text-gray-200 mb-2">
                    What could we improve?
                  </label>
                  <textarea
                    id="improvements"
                    name="improvements"
                    value={formData.improvements}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#333333] rounded-lg text-white focus:outline-none focus:border-[#D47F7D]"
                    placeholder="Help us get better..."
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="wouldRecommend" className="block text-sm font-medium text-gray-200 mb-2">
                    Would you recommend this league to others? <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="wouldRecommend"
                    name="wouldRecommend"
                    value={formData.wouldRecommend}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#333333] rounded-lg text-white focus:outline-none focus:border-[#D47F7D]"
                  >
                    <option value="">Select an option</option>
                    <option value="definitely">Definitely</option>
                    <option value="probably">Probably</option>
                    <option value="maybe">Maybe</option>
                    <option value="probably-not">Probably Not</option>
                    <option value="definitely-not">Definitely Not</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label htmlFor="additionalComments" className="block text-sm font-medium text-gray-200 mb-2">
                    Additional Comments
                  </label>
                  <textarea
                    id="additionalComments"
                    name="additionalComments"
                    value={formData.additionalComments}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#333333] rounded-lg text-white focus:outline-none focus:border-[#D47F7D]"
                    placeholder="Anything else you'd like to share..."
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 bg-[#2a2a2a] hover:bg-[#3a3a3a] rounded-lg font-semibold transition-colors text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    !formData.name ||
                    !formData.email ||
                    formData.overallRating === 0 ||
                    formData.organizationRating === 0 ||
                    formData.facilitiesRating === 0 ||
                    formData.communicationRating === 0 ||
                    formData.valueRating === 0 ||
                    !formData.wouldRecommend
                  }
                  className="px-6 py-3 bg-[#D47F7D] hover:bg-[#D47F7D]/90 rounded-lg font-semibold transition-colors text-black disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  )
}


