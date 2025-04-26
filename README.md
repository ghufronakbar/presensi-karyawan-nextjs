# API Documentation

This document outlines the available API endpoints, their methods, requirements, and response interfaces for the employee attendance management system.

## Authentication Endpoints

### Login (`/api/auth/login`)

**Method:** POST

**Description:** Authenticates a user and returns a JWT token.

**Request Body:**
```json
{
  "email": "string", // Required
  "password": "string" // Required
}
```

**Responses:**
- `200 OK`
  ```json
  {
    "message": "Berhasil login",
    "data": {
      "id": "string",
      "name": "string",
      "email": "string",
      "staffNumber": "string",
      "position": "string",
      "role": "Admin" | "User",
      "token": "string"
    }
  }
  ```
- `400 Bad Request` - Email and password are required
- `401 Unauthorized` - Incorrect password
- `404 Not Found` - User not found
- `500 Internal Server Error` - Server error

### Check Token (`/api/auth/check`)

**Method:** GET

**Description:** Validates the JWT token and returns user information.

**Headers:**
- `Authorization: Bearer {token}` (Required)

**Responses:**
- `200 OK`
  ```json
  {
    "message": "Token valid",
    "data": {
      "id": "string",
      "name": "string",
      "email": "string",
      "staffNumber": "string",
      "position": "string",
      "role": "Admin" | "User"
    }
  }
  ```
- `401 Unauthorized` - Invalid token
- `500 Internal Server Error` - Server error

## User Endpoints

### User Profile (`/api/user/profile`)

**Method:** GET

**Description:** Retrieves the authenticated user's profile information.

**Headers:**
- `Authorization: Bearer {token}` (Required)

**Responses:**
- `200 OK`
  ```json
  {
    "status": "success",
    "data": {
      "id": "string",
      "name": "string",
      "email": "string",
      "staffNumber": "string",
      "position": "string",
      "role": "Admin" | "User",
      "image": "string" | null
    }
  }
  ```
- `401 Unauthorized` - Invalid token
- `404 Not Found` - User not found
- `500 Internal Server Error` - Server error

**Method:** PUT

**Description:** Updates the authenticated user's profile information.

**Headers:**
- `Authorization: Bearer {token}` (Required)

**Request Body:**
```json
{
  "name": "string", // Required
  "email": "string", // Required
  "position": "string", // Required
  "image": "string" | null // Optional
}
```

**Responses:**
- `200 OK`
  ```json
  {
    "status": "success",
    "message": "Profile berhasil diubah",
    "data": {
      "id": "string",
      "name": "string",
      "email": "string",
      "staffNumber": "string",
      "position": "string",
      "role": "Admin" | "User",
      "image": "string" | null,
      "token": "string" // New JWT token
    }
  }
  ```
- `400 Bad Request` - Missing required fields or email already registered
- `401 Unauthorized` - Invalid token
- `404 Not Found` - User not found
- `500 Internal Server Error` - Server error

**Method:** PATCH

**Description:** Updates the authenticated user's password.

**Headers:**
- `Authorization: Bearer {token}` (Required)

**Request Body:**
```json
{
  "currentPassword": "string", // Required
  "newPassword": "string" // Required
}
```

**Responses:**
- `200 OK`
  ```json
  {
    "status": "success",
    "message": "Password berhasil diubah"
  }
  ```
- `400 Bad Request` - Missing required fields
- `401 Unauthorized` - Invalid token or incorrect current password
- `404 Not Found` - User not found
- `500 Internal Server Error` - Server error

### User Overview (`/api/user/overview`)

**Method:** GET

**Description:** Retrieves a summary of the user's data including attendance and leave information.

**Headers:**
- `Authorization: Bearer {token}` (Required)

**Responses:**
- `200 OK`
  ```json
  {
    "status": "success",
    "data": {
      "user": {
        "id": "string",
        "name": "string",
        "staffNumber": "string",
        "position": "string",
        "email": "string"
      },
      "attendance": {
        "monthlyTotal": "number",
        "hasTodayAttendance": "boolean",
        "lateCount": "number"
      },
      "leave": {
        "workLeave": {
          "limit": "number",
          "used": "number",
          "remaining": "number"
        },
        "sickLeave": {
          "limit": "number",
          "used": "number",
          "remaining": "number"
        },
        "pending": "number"
      }
    }
  }
  ```
- `401 Unauthorized` - Invalid token
- `404 Not Found` - User not found or system information not found
- `500 Internal Server Error` - Server error

### User Attendance (`/api/user/attendance`)

**Method:** GET

**Description:** Retrieves the authenticated user's attendance history.

**Headers:**
- `Authorization: Bearer {token}` (Required)

**Responses:**
- `200 OK`
  ```json
  {
    "status": "success",
    "data": {
      "masuk": [
        {
          "id": "string",
          "userId": "string",
          "time": "date",
          "type": "Masuk",
          "status": "Hadir" | "Telat" | "Ijin" | "Sakit",
          "lateTime": "number",
          "createdAt": "date",
          "updatedAt": "date"
        }
      ],
      "keluar": [
        {
          "id": "string",
          "userId": "string",
          "time": "date",
          "type": "Keluar",
          "status": "Hadir" | "Telat" | "Ijin" | "Sakit",
          "lateTime": "number",
          "createdAt": "date",
          "updatedAt": "date"
        }
      ]
    }
  }
  ```
- `401 Unauthorized` - Invalid token
- `500 Internal Server Error` - Server error

**Method:** POST

**Description:** Creates a new attendance record (check-in or check-out) for the authenticated user.

**Headers:**
- `Authorization: Bearer {token}` (Required)

**Request Body:**
```json
{
  "qrCode": "string" // Required - QR code for attendance validation
}
```

**Responses:**
- `200 OK`
  ```json
  {
    "message": "Berhasil presensi masuk/keluar",
    "data": {
      "id": "string",
      "userId": "string",
      "type": "Masuk" | "Keluar",
      "status": "Hadir" | "Telat" | "Ijin" | "Sakit",
      "time": "date",
      "lateTime": "number",
      "createdAt": "date",
      "updatedAt": "date"
    }
  }
  ```
- `400 Bad Request` - QR code is empty, not yet time to check in, or already checked in/out today
- `401 Unauthorized` - Invalid token
- `404 Not Found` - Invalid QR code
- `500 Internal Server Error` - Server error

### User Leave (`/api/user/leave`)

**Method:** GET

**Description:** Retrieves the authenticated user's leave history.

**Headers:**
- `Authorization: Bearer {token}` (Required)

**Responses:**
- `200 OK`
  ```json
  {
    "message": "Leaves fetched successfully",
    "data": [
      {
        "id": "string",
        "userId": "string",
        "reason": "string",
        "attachment": "string" | null,
        "type": "Sakit" | "Cuti",
        "date": "date",
        "status": "Pending" | "Diterima" | "Ditolak",
        "createdAt": "date",
        "updatedAt": "date"
      }
    ]
  }
  ```
- `401 Unauthorized` - Invalid token
- `500 Internal Server Error` - Server error

**Method:** POST

**Description:** Creates a new leave request for the authenticated user.

**Headers:**
- `Authorization: Bearer {token}` (Required)

**Request Body:**
```json
{
  "reason": "string", // Required
  "type": "Sakit" | "Cuti", // Required
  "date": "date", // Required
  "attachment": "string" | null // Optional
}
```

**Responses:**
- `201 Created`
  ```json
  {
    "status": "success",
    "message": "Permintaan cuti berhasil dibuat",
    "data": {
      "id": "string",
      "userId": "string",
      "reason": "string",
      "attachment": "string" | null,
      "type": "Sakit" | "Cuti",
      "date": "date",
      "status": "Pending",
      "createdAt": "date",
      "updatedAt": "date"
    }
  }
  ```
- `400 Bad Request` - Missing required fields, invalid date format, already has attendance for this date, or already has a pending/approved leave for this date
- `401 Unauthorized` - Invalid token
- `500 Internal Server Error` - Server error

### User Leave Detail (`/api/user/leave/[id]`)

**Method:** GET

**Description:** Retrieves details of a specific leave request.

**Headers:**
- `Authorization: Bearer {token}` (Required)

**Path Parameters:**
- `id` - The ID of the leave request

**Responses:**
- `200 OK`
  ```json
  {
    "status": "success",
    "data": {
      "id": "string",
      "userId": "string",
      "reason": "string",
      "attachment": "string" | null,
      "type": "Sakit" | "Cuti",
      "date": "date",
      "status": "Pending" | "Diterima" | "Ditolak",
      "createdAt": "date",
      "updatedAt": "date",
      "user": {
        "name": "string",
        "staffNumber": "string",
        "position": "string",
        "email": "string"
      }
    }
  }
  ```
- `401 Unauthorized` - Invalid token
- `404 Not Found` - Leave request not found
- `500 Internal Server Error` - Server error

## Image Upload Endpoint

### Image Upload (`/api/image`)

**Method:** POST

**Description:** Uploads an image to Cloudinary and returns the URL.

**Request Body:**
- Form data with `images` field containing an image file

**Responses:**
- `200 OK`
  ```json
  {
    "message": "Berhasil mengupload gambar",
    "data": {
      "url": "string" // URL of the uploaded image
    }
  }
  ```
- `400 Bad Request` - No image provided
- `500 Internal Server Error` - Error uploading image

## QR Code Endpoint

### QR Code (`/api/qr-code`)

**Method:** GET

**Description:** Retrieves the current QR code for attendance.

**Responses:**
- `200 OK`
  ```json
  {
    "status": "success",
    "data": {
      "qrCode": "string"
    }
  }
  ```
- `500 Internal Server Error` - Server error
