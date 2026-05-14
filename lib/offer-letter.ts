export interface OfferLetterData {
  employeeId: string
  firstName: string
  lastName: string
  email: string
  phone: string
  state: string
  approvalDate: string
}

export function generateOfferLetterHTML(data: OfferLetterData): string {
  const offerDate = new Date(data.approvalDate).toLocaleDateString('en-AU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #1f2d2b;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 3px solid #48C9B0;
            padding-bottom: 20px;
        }
        .logo {
            font-size: 28px;
            font-weight: bold;
            color: #48C9B0;
            margin-bottom: 10px;
        }
        .offer-number {
            color: #6b7b78;
            font-size: 12px;
        }
        .section {
            margin-bottom: 25px;
        }
        .section-title {
            font-size: 16px;
            font-weight: bold;
            color: #48C9B0;
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .employee-details {
            background: #f7fefe;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        .detail-row {
            margin-bottom: 8px;
        }
        .detail-label {
            font-weight: bold;
            color: #1f2d2b;
            display: inline-block;
            width: 120px;
        }
        .highlight {
            background: #E8FFFB;
            padding: 15px;
            border-left: 4px solid #48C9B0;
            margin: 15px 0;
        }
        .terms-list {
            margin-left: 20px;
        }
        .terms-list li {
            margin-bottom: 10px;
        }
        .signature-section {
            margin-top: 40px;
            border-top: 1px solid #6b7b78;
            padding-top: 20px;
        }
        .acceptance-link {
            display: inline-block;
            background: #48C9B0;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 6px;
            margin: 20px 0;
            font-weight: bold;
        }
        .footer {
            margin-top: 40px;
            font-size: 12px;
            color: #6b7b78;
            border-top: 1px solid #ddd;
            padding-top: 15px;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">Washlee</div>
        <p style="margin: 0; color: #6b7b78;">Professional Laundry Service Marketplace</p>
        <p class="offer-number">Employee ID: <strong>${data.employeeId}</strong></p>
    </div>

    <div class="section">
        <p>Dear ${data.firstName} ${data.lastName},</p>
        <p>
            Congratulations! We are pleased to offer you an opportunity to become a Washlee Pro Partner. 
            After careful review of your application and qualifications, we believe you would be a valuable 
            addition to our growing network of professional laundry service providers.
        </p>
    </div>

    <div class="section">
        <div class="section-title">Employee Details</div>
        <div class="employee-details">
            <div class="detail-row">
                <span class="detail-label">Name:</span>
                <span>${data.firstName} ${data.lastName}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Email:</span>
                <span>${data.email}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Phone:</span>
                <span>${data.phone}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">State:</span>
                <span>${data.state}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Employee ID:</span>
                <span style="color: #48C9B0; font-weight: bold;">${data.employeeId}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Offer Date:</span>
                <span>${offerDate}</span>
            </div>
        </div>
    </div>

    <div class="section">
        <div class="section-title">Position & Responsibilities</div>
        <p>
            <strong>Role:</strong> Washlee Pro Partner - Laundry Service Operator
        </p>
        <p>
            As a Washlee Pro Partner, you will be responsible for:
        </p>
        <ul class="terms-list">
            <li>Providing high-quality on-demand laundry pickup and delivery services to customers</li>
            <li>Maintaining professional standards and customer service excellence</li>
            <li>Adhering to all Washlee operational guidelines and quality standards</li>
            <li>Managing customer communications and feedback professionally</li>
            <li>Maintaining your own laundry equipment and supplies</li>
            <li>Conducting services in compliance with Australian workplace and health regulations</li>
        </ul>
    </div>

    <div class="section">
        <div class="section-title">Terms & Conditions</div>
        <div class="highlight">
            <strong>Important:</strong> This offer is contingent upon:
            <ul class="terms-list">
                <li>Verification of all information provided in your application</li>
                <li>Valid work rights in Australia</li>
                <li>Current driver's license (minimum 18 years old)</li>
                <li>Access to reliable transportation and laundry equipment</li>
                <li>Compliance with Washlee Pro Code of Conduct</li>
                <li>Background verification (if applicable)</li>
            </ul>
        </div>
        
        <p><strong>Compensation & Payment:</strong></p>
        <ul class="terms-list">
            <li>Earnings are commission-based per completed order, with the payout shown before acceptance</li>
            <li>Customer service options include standard wash & fold, express same-day, delicates / special care, hang dry, and protection add-ons</li>
            <li>Wash Club is a free customer loyalty program, not a paid subscription or Pro tier</li>
            <li>Weekly payments via bank transfer</li>
            <li>Detailed earnings dashboard and transaction history</li>
        </ul>

        <p><strong>Professional Obligations:</strong></p>
        <ul class="terms-list">
            <li>Maintain professional appearance and conduct at all times</li>
            <li>Respond to customer inquiries within 4 hours</li>
            <li>Achieve and maintain minimum service quality ratings</li>
            <li>Honor scheduled pickups and delivery times</li>
            <li>Maintain customer confidentiality and privacy</li>
            <li>Report any issues or service failures immediately</li>
        </ul>

        <p><strong>Duration & Termination:</strong></p>
        <ul class="terms-list">
            <li>This partnership is ongoing with a probationary period of 30 days</li>
            <li>Either party may terminate with 14 days written notice</li>
            <li>Termination for breach of code of conduct is immediate</li>
            <li>Upon termination, all customer accounts transfer back to Washlee</li>
        </ul>
    </div>

    <div class="section">
        <div class="section-title">Next Steps</div>
        <p>
            To accept this offer and activate your Washlee Pro account, please click the button below:
        </p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/employee/accept-offer?employeeId=${data.employeeId}" class="acceptance-link">
            Accept Offer & Activate Account
        </a>
        <p style="color: #6b7b78; margin-top: 20px;">
            Link expires in 30 days. After acceptance, you'll have immediate access to your employee dashboard.
        </p>
    </div>

    <div class="section">
        <div class="section-title">Dashboard Access</div>
        <p>
            Once you accept this offer, you'll gain access to:
        </p>
        <ul class="terms-list">
            <li>Real-time job listings in your service area</li>
            <li>Earnings tracking and analytics</li>
            <li>Customer ratings and reviews</li>
            <li>Payout management and history</li>
            <li>Performance metrics and ratings</li>
            <li>Support and communication tools</li>
        </ul>
    </div>

    <div class="section">
        <p>
            We're excited to have you join the Washlee community! If you have any questions about this offer 
            or need clarification on any terms, please don't hesitate to contact us.
        </p>
        <p>
            <strong>Warm regards,</strong><br>
            The Washlee Team<br>
            <a href="mailto:support@washlee.com">support@washlee.com</a>
        </p>
    </div>

    <div class="signature-section">
        <p style="color: #6b7b78;">
            This is an automated offer letter. Your acceptance of this offer constitutes an agreement 
            to the Washlee Pro Partner Terms & Conditions. Please review all terms carefully before accepting.
        </p>
    </div>

    <div class="footer">
        <p>Washlee Pty Ltd | Professional Laundry Service Marketplace | Australia</p>
        <p style="margin: 0; color: #999;">This email and its contents are confidential.</p>
    </div>
</body>
</html>
  `
}
