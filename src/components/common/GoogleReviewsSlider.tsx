import React, { useState, useEffect } from 'react';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';

interface Review {
  author_name: string;
  rating: number;
  text: string;
  time: number;
  profile_photo_url: string;
}

interface ReviewsResponse {
  reviews: Review[];
  totalRatings: number;
  averageRating: number;
}

const GoogleReviewsSlider = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalRatings, setTotalRatings] = useState(0);
  const [averageRating, setAverageRating] = useState(0);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/api/reviews');
        if (!response.ok) {
          throw new Error('Failed to fetch reviews');
        }
        const data: ReviewsResponse = await response.json();
        setReviews(data.reviews);
        setTotalRatings(data.totalRatings);
        setAverageRating(data.averageRating);
      } catch (error) {
        console.error('Error fetching reviews:', error);
        setError('Unable to load reviews at this time');
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  const nextReview = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % reviews.length);
  };

  const prevReview = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + reviews.length) % reviews.length);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  if (error && reviews.length === 0) {
    return null;
  }

  if (reviews.length === 0) {
    return null;
  }

  return (
    <div className="relative bg-white py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4">What Our Customers Say</h2>
          <div className="flex justify-center items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className={`h-5 w-5 ${i < Math.round(averageRating) ? 'text-brand-500 fill-current' : 'text-gray-300'}`} />
            ))}
            <span className="ml-2 text-gray-600">{averageRating.toFixed(1)} out of 5</span>
            {totalRatings > 0 && (
              <span className="ml-2 text-gray-500">({totalRatings} reviews)</span>
            )}
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="relative">
            <div className="overflow-hidden">
              <div className="flex transition-transform duration-500 ease-in-out" style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
                {reviews.map((review, index) => (
                  <div key={index} className="w-full flex-shrink-0 px-4">
                    <div className="bg-gray-50 rounded-lg p-8 shadow-sm">
                      <div className="flex items-center mb-6">
                        <img
                          src={review.profile_photo_url}
                          alt={review.author_name}
                          className="w-12 h-12 rounded-full mr-4"
                        />
                        <div>
                          <h3 className="font-semibold">{review.author_name}</h3>
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < review.rating ? 'text-brand-500 fill-current' : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      <p className="text-gray-600 italic">"{review.text}"</p>
                      <p className="text-sm text-gray-500 mt-4">
                        {new Date(review.time < 10_000_000_000 ? review.time * 1000 : review.time).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={prevReview}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-white rounded-full p-2 shadow-lg hover:bg-gray-50 transition"
            >
              <ChevronLeft className="h-6 w-6 text-gray-600" />
            </button>

            <button
              onClick={nextReview}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-white rounded-full p-2 shadow-lg hover:bg-gray-50 transition"
            >
              <ChevronRight className="h-6 w-6 text-gray-600" />
            </button>
          </div>

          <div className="flex justify-center mt-6 gap-2">
            {reviews.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition ${
                  index === currentIndex ? 'bg-brand-500' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoogleReviewsSlider; 