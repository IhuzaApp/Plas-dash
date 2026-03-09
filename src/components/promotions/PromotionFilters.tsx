import React from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface PromotionFiltersProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    onClearSearch: () => void;
}

export const PromotionFilters: React.FC<PromotionFiltersProps> = ({
    searchQuery,
    onSearchChange,
    onClearSearch,
}) => {
    return (
        <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search promotions by name, code, status, or discount..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={e => onSearchChange(e.target.value)}
                />
                {searchQuery && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-2 h-5 w-5 p-0"
                        onClick={onClearSearch}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                )}
            </div>
            <Button variant="outline" className="flex items-center gap-2">
                <Filter className="h-4 w-4" /> Filter
            </Button>
        </div>
    );
};
