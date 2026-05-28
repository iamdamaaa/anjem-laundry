<?php

namespace App\Mail;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PaymentRejectedMail extends Mailable
{
    use Queueable, SerializesModels;

    public Order $order;
    public string $rejection_reason;

    /**
     * Create a new message instance.
     */
    public function __construct(Order $order, string $rejection_reason)
    {
        $this->order = $order;
        $this->rejection_reason = $rejection_reason;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Pembayaran untuk Pesanan #{$this->order->order_number} Ditolak",
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.payment-rejected',
            with: [
                'rejection_reason' => $this->rejection_reason
            ]
        );
    }
}
