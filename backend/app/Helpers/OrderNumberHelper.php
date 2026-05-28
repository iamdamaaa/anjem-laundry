<?php

namespace App\Helpers;

use App\Models\Order;

class OrderNumberHelper
{
    /**
     * Generate a unique sequential order number: LDR-YYYYMMDD-XXXX
     */
    public static function generate(): string
    {
        $dateStr = now()->format('Ymd'); // YYYYMMDD
        $prefix = "LDR-{$dateStr}-";

        // Find the latest order number created today
        $latestOrder = Order::withTrashed()
            ->where('order_number', 'like', $prefix . '%')
            ->orderBy('order_number', 'desc')
            ->first();

        if ($latestOrder) {
            // Extract sequence number (last 4 digits)
            $lastSeq = substr($latestOrder->order_number, -4);
            $nextSeq = (int) $lastSeq + 1;
        } else {
            $nextSeq = 1;
        }

        // Format to 4 digits (e.g. 0001)
        $seqStr = str_pad((string) $nextSeq, 4, '0', STR_PAD_LEFT);

        return $prefix . $seqStr;
    }
}
