export const getWelcomeEmailHtml = (name) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to ShaFood</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f4f4f4;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 30px; padding: 20px;">
            <img src="${process.env.NEXT_PUBLIC_APP_URL}/logo.png" alt="ShaFood Logo" style="max-width: 150px; margin-bottom: 10px;">
            <h1 style="color: #f97316; margin: 0; font-size: 32px;">ShaFood</h1>
            <p style="color: #666; font-size: 16px; margin-top: 5px;">Share Food, Share Joy</p>
        </div>
        
        <!-- Main Content -->
        <div style="background-color: #fff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin-top: 0; font-size: 24px;">Welcome to ShaFood, ${name}! 🎉</h2>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
                We're thrilled to have you join our community of food lovers! Get ready to experience
                a new way of ordering and sharing food with people around you.
            </p>
            
            <h3 style="color: #f97316; margin-top: 25px; font-size: 20px;">What you can do with ShaFood:</h3>
            <ul style="color: #666; font-size: 16px; padding-left: 20px; line-height: 1.8;">
                <li>Connect with nearby users to share food orders</li>
                <li>Save up to 50% on delivery fees</li>
                <li>Contribute to reducing food delivery carbon footprint</li>
                <li>Chat with other foodies in real-time</li>
                <li>Discover new restaurants and cuisines</li>
            </ul>
            
            <!-- CTA Button -->
            <div style="text-align: center; margin-top: 35px;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
                   style="background-color: #f97316; color: white; padding: 14px 28px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; font-size: 16px; transition: background-color 0.3s ease;">
                    Get Started Now
                </a>
            </div>

            <!-- Quick Tips -->
            <div style="margin-top: 35px; padding: 20px; background-color: #fff8f3; border-radius: 5px;">
                <h4 style="color: #f97316; margin-top: 0; font-size: 18px;">🌟 Quick Tips to Get Started:</h4>
                <ol style="color: #666; font-size: 15px; padding-left: 20px; margin: 10px 0;">
                    <li>Complete your profile</li>
                    <li>Set your delivery location</li>
                    <li>Browse nearby sharing opportunities</li>
                    <li>Join your first shared order</li>
                </ol>
            </div>
        </div>
        
        <!-- Footer -->
        <div style="text-align: center; margin-top: 30px; color: #666; font-size: 14px;">
            <p style="margin: 5px 0;">Need help? Contact us at <a href="mailto:support@shafood.com" style="color: #f97316; text-decoration: none;">support@shafood.com</a></p>
            <div style="margin-top: 20px;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/terms" style="color: #666; text-decoration: none; margin: 0 10px;">Terms</a>
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/privacy" style="color: #666; text-decoration: none; margin: 0 10px;">Privacy</a>
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/faq" style="color: #666; text-decoration: none; margin: 0 10px;">FAQ</a>
            </div>
            <p style="margin-top: 20px;">&copy; ${new Date().getFullYear()} ShaFood. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
`; 