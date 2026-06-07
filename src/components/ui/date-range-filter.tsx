import { ApplicationSettingsService } from '@/lib/firebase-services';
import React, { useEffect, useCallback } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Pencil, Check, X } from "lucide-react"

export type DateFilterType = "all" | "today" | "yesterday" | "week" | "month" | "this_year" | "new_ver" | "custom";

interface DateRangeFilterProps {
    filterType: DateFilterType;
    onFilterTypeChange: (type: DateFilterType) => void;
    startDate: Date | null;
    endDate: Date | null;
    onDateRangeChange: (start: Date | null, end: Date | null) => void;
}

export function DateRangeFilter({
    filterType,
    onFilterTypeChange,
    startDate,
    endDate,
    onDateRangeChange
}: DateRangeFilterProps) {

    const [newVerStartDate, setNewVerStartDate] = React.useState<Date>(new Date(2026, 1, 18));
    const [isSettingsLoaded, setIsSettingsLoaded] = React.useState(false);
    const [isEditingNewVer, setIsEditingNewVer] = React.useState(false);

    // Subscribe to settings from Firebase
    useEffect(() => {
        const unsubscribe = ApplicationSettingsService.subscribeToSettings((settings) => {
            if (settings && settings.newVerStartDate) {
                setNewVerStartDate(new Date(settings.newVerStartDate));
                setIsSettingsLoaded(true);
            }
        });
        return () => unsubscribe();
    }, []);

    // Helper to get date ranges based on filter type
    const getDateRange = useCallback((type: DateFilterType): { start: Date | null, end: Date | null } => {
        const now = new Date();
        const start = new Date(now);
        const end = new Date(now);

        // Set end to end of day
        end.setHours(23, 59, 59, 999);

        switch (type) {
            case "new_ver":
                return { start: newVerStartDate, end: null };
            case "today":
                start.setHours(0, 0, 0, 0);
                return { start, end };
            case "yesterday":
                start.setDate(now.getDate() - 1);
                start.setHours(0, 0, 0, 0);
                end.setDate(now.getDate() - 1);
                end.setHours(23, 59, 59, 999);
                return { start, end };
            case "week":
                const day = now.getDay();
                const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
                start.setDate(diff);
                start.setHours(0, 0, 0, 0);
                return { start, end };
            case "month":
                start.setDate(1);
                start.setHours(0, 0, 0, 0);
                return { start, end };
            case "this_year":
                start.setMonth(0, 1);
                start.setHours(0, 0, 0, 0);
                return { start, end };
            case "all":
                return { start: null, end: null };
            default:
                return { start: null, end: null };
        }
    }, [newVerStartDate]);

    useEffect(() => {
        if (filterType !== "custom") {
            const { start, end } = getDateRange(filterType);

            // Only update if settings are loaded (for new_ver) or if it's another filter type
            if (filterType === 'new_ver' && !isSettingsLoaded) return;

            const currentStart = startDate ? startDate.getTime() : null;
            const currentEnd = endDate ? endDate.getTime() : null;
            const newStart = start ? start.getTime() : null;
            const newEnd = end ? end.getTime() : null;

            if (currentStart !== newStart || currentEnd !== newEnd) {
                onDateRangeChange(start, end);
            }
        }
    }, [filterType, startDate, endDate, onDateRangeChange, newVerStartDate, isSettingsLoaded, getDateRange]);

    const handleCustomStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const date = e.target.value ? new Date(e.target.value) : null;
        if (date) date.setHours(0, 0, 0, 0);
        onDateRangeChange(date, endDate);
    };

    const handleCustomEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const date = e.target.value ? new Date(e.target.value) : null;
        if (date) date.setHours(23, 59, 59, 999);
        onDateRangeChange(startDate, date);
    };

    const containerRef = React.useRef<HTMLDivElement>(null);
    const inputRef = React.useRef<HTMLInputElement>(null);

    const startEditing = () => {
        setIsEditingNewVer(true);
        // We rely on defaultValue="" in the render to ensure it starts blank
    };

    const cancelEditing = () => {
        setIsEditingNewVer(false);
    };

    const commitNewVerDate = async () => {
        const dateStr = inputRef.current?.value;
        if (!dateStr) {
            cancelEditing();
            return;
        }

        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return;

        setIsEditingNewVer(false);
        date.setHours(0, 0, 0, 0);

        // Optimistic update
        setNewVerStartDate(date);

        // Update in Firebase
        try {
            await ApplicationSettingsService.updateSettings({ newVerStartDate: date.toISOString() });
        } catch (error) {
            console.error("Failed to update new ver start date:", error);
        }
    };

    // Handle clicking outside to cancel
    const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
        // If the new focus target is NOT within our container, then we cancel/revert.
        if (!containerRef.current?.contains(e.relatedTarget as Node)) {
            cancelEditing();
        }
    };

    return (
        <div className="flex items-center gap-2">
            <Select value={filterType} onValueChange={(val) => onFilterTypeChange(val as DateFilterType)}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="new_ver">New ver. {newVerStartDate ? `(${newVerStartDate.toLocaleDateString()})` : ''}</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="yesterday">Yesterday</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="this_year">This Year</SelectItem>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="custom">Fixed Date / Custom</SelectItem>
                </SelectContent>
            </Select>

            {filterType === "new_ver" && (
                <div className="flex items-center gap-2">
                    {!isEditingNewVer ? (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={startEditing}
                            title="Change Start Date"
                            className="h-8 w-8"
                        >
                            <Pencil className="h-4 w-4" />
                        </Button>
                    ) : (
                        <div
                            ref={containerRef}
                            className="flex items-center gap-1 animate-in fade-in slide-in-from-left-5"
                            onBlur={handleBlur}
                        >
                            <span className="text-sm text-muted-foreground whitespace-nowrap">Start From:</span>
                            <Input
                                ref={inputRef}
                                type="date"
                                defaultValue=""
                                className="w-[150px]"
                                autoFocus
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') commitNewVerDate();
                                    if (e.key === 'Escape') cancelEditing();
                                }}
                            />
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={commitNewVerDate}
                                className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                title="Save"
                            >
                                <Check className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={cancelEditing}
                                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                title="Cancel"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </div>
            )}

            {filterType === "custom" && (
                <div className="flex items-center gap-2">
                    <Input
                        type="date"
                        value={startDate ? startDate.toISOString().split('T')[0] : ''}
                        onChange={handleCustomStartDateChange}
                        className="w-[150px]"
                    />
                    <span className="text-muted-foreground">-</span>
                    <Input
                        type="date"
                        value={endDate ? endDate.toISOString().split('T')[0] : ''}
                        onChange={handleCustomEndDateChange}
                        className="w-[150px]"
                    />
                </div>
            )}
        </div>
    )
}
