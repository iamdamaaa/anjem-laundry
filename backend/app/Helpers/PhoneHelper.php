<?php

namespace App\Helpers;

class PhoneHelper
{
    /**
     * Normalize a phone number to standard format: 628xxxxxxxx
     */
    public static function normalize(string $phone): string
    {
        // Remove all non-digit characters
        $cleaned = preg_replace('/\D/', '', $phone);

        // Convert leading '08' to '628'
        if (str_starts_with($cleaned, '08')) {
            $cleaned = '628' . substr($cleaned, 2);
        }
        // Convert leading '8' to '628'
        elseif (str_starts_with($cleaned, '8')) {
            $cleaned = '62' . $cleaned;
        }

        return $cleaned;
    }
}
