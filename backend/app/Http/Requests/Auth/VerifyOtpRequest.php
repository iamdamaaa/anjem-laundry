<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class VerifyOtpRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'phone'   => 'required|string|min:7|max:20',
            'code'    => 'required|string|size:6',
            'purpose' => 'required|string|in:register,login',
            'name'    => 'required_if:purpose,register|string|max:100',
        ];
    }

    /**
     * Custom validation messages.
     */
    public function messages(): array
    {
        return [
            'phone.required'   => 'Nomor telepon wajib diisi.',
            'phone.min'        => 'Nomor telepon minimal 7 karakter.',
            'phone.max'        => 'Nomor telepon maksimal 20 karakter.',
            'code.required'    => 'Kode OTP wajib diisi.',
            'code.size'        => 'Kode OTP harus berupa 6 karakter/digit.',
            'purpose.required' => 'Tujuan verifikasi OTP wajib ditentukan.',
            'purpose.in'       => 'Tujuan verifikasi OTP tidak valid.',
            'name.required_if' => 'Nama wajib diisi saat registrasi.',
            'name.max'         => 'Nama maksimal 100 karakter.',
        ];
    }
}
