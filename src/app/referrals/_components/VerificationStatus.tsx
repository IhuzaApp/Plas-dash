import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface VerificationStatusProps {
  phoneVerifiedCount: number;
  emailProvidedCount: number;
  deviceFingerprintedCount: number;
}

export const VerificationStatus: React.FC<VerificationStatusProps> = ({
  phoneVerifiedCount,
  emailProvidedCount,
  deviceFingerprintedCount,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">Verification Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Phone Verified</span>
            <Badge variant="secondary" className="bg-purple-50 text-purple-700 hover:bg-purple-50">
              {phoneVerifiedCount}
            </Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Email Provided</span>
            <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-50">
              {emailProvidedCount}
            </Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Device Fingerprinted</span>
            <Badge variant="secondary" className="bg-gray-50 text-gray-700 hover:bg-gray-50">
              {deviceFingerprintedCount}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
