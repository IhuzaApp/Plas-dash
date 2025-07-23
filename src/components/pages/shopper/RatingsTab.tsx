import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star } from 'lucide-react';
import { format } from 'date-fns';

interface RatingsTabProps {
  paginatedRatings: any[];
  ratingsPage: number;
  totalRatings: number;
  setRatingsPage: (page: number) => void;
  calculateAverageRating: (ratings: any[]) => string;
  detailedShopper: any;
  renderPagination: (currentPage: number, totalItems: number, onPageChange: (page: number) => void) => React.ReactNode;
}

const RatingsTab: React.FC<RatingsTabProps> = ({
  paginatedRatings,
  ratingsPage,
  totalRatings,
  setRatingsPage,
  calculateAverageRating,
  detailedShopper,
  renderPagination,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
          <span>
            {calculateAverageRating(detailedShopper?.User?.Ratings || [])}
            <span className="text-sm text-muted-foreground ml-2">
              ({totalRatings} reviews)
            </span>
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {paginatedRatings && paginatedRatings.length > 0 ? (
            paginatedRatings.map((rating: any) => (
              <div key={rating.id} className="border-b pb-6">
                <div className="flex justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{rating.rating}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(rating.created_at), 'MMM d, yyyy')}
                  </span>
                </div>
                <p className="text-sm mb-4">{rating.review}</p>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="text-sm text-muted-foreground">Delivery Experience</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{rating.delivery_experience}/5</span>
                    </div>
                  </div>
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="text-sm text-muted-foreground">Packaging Quality</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{rating.packaging_quality}/5</span>
                    </div>
                  </div>
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="text-sm text-muted-foreground">Professionalism</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{rating.professionalism}/5</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-muted-foreground py-8">
              {totalRatings === 0 ? 'No ratings yet' : 'Loading ratings...'}
            </div>
          )}
        </div>
        {renderPagination(ratingsPage, totalRatings, setRatingsPage)}
      </CardContent>
    </Card>
  );
};

export default RatingsTab; 