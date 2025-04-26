import nodemailer from 'nodemailer';
import { NODEMAILER_EMAIL, NODEMAILER_PASS } from '@/constants/env';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: NODEMAILER_EMAIL,
    pass: NODEMAILER_PASS,
  },
});

export default transporter; 