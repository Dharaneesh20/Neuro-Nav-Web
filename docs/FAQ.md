# NeuroNav - Frequently Asked Questions

## General Questions

### What is NeuroNav?
NeuroNav is a comprehensive autism support companion application that helps individuals with autism navigate unfamiliar environments, manage sensory overload, and communicate during high-anxiety situations using AI-powered sensory analysis.

### Who is NeuroNav for?
NeuroNav is designed for autistic individuals of all ages and support levels, as well as their caregivers, therapists, and support networks.

### Is NeuroNav available for iOS/Android?
Currently, NeuroNav is a web application. Mobile app development is planned for v1.1.

### How much does NeuroNav cost?
NeuroNav is open-source and free to use. Cloud hosting may involve costs, but the software itself is MIT licensed.

---

## Technical Questions

### What are the system requirements?
- Browser: Chrome, Firefox, Safari, or Edge (latest versions)
- Internet: Broadband connection required
- Optional: Location services enabled for route planning

### Can I use NeuroNav offline?
Currently, NeuroNav requires an internet connection. Offline functionality is planned for future versions.

### How is my data stored?
- Data is stored in MongoDB
- Sensitive data (passwords) are encrypted with bcrypt
- All communications use HTTPS
- Data is never shared with third parties

### How private is my data?
- Your sensory preferences are only visible to you and caregivers you authorize
- Community reports are anonymized
- We comply with GDPR and privacy regulations
- See our Privacy Policy for details

### What happens if I forget my password?
You can use the "Forgot Password" link on the login page. A reset link will be sent to your email.

---

## Feature Questions

### How does the calm score work?
The calm score is calculated by Gemini Flash 2.5 AI based on environmental data you input (noise level, lighting, crowding, etc.) combined with your personal sensory preferences. It ranges from 0-100, where 100 is the most calm.

### Can I use the panic button while offline?
The panic button requires an internet connection to send notifications to your caregivers. Location sharing also requires connectivity.

### How do I add safe havens?
1. Go to Safe Havens section
2. Click "Add New Haven"
3. Enter location details and sensory features
4. Submit for community verification

### Can I track my sensory patterns?
Yes! The History & Analytics section shows:
- Sensory trigger patterns over time
- Calm score trends
- Route effectiveness
- Music therapy effectiveness

### How do I export my data?
1. Go to Data Export
2. Select date range
3. Choose PDF or Excel format
4. Download or share with therapist

---

## Account & Security

### How do I create an account?
1. Visit NeuroNav homepage
2. Click "Sign Up"
3. Enter email, name, and password
4. Configure sensory preferences
5. Add caregiver contacts

### How do I add caregivers?
1. Go to Profile Settings
2. Click "Add Caregiver"
3. Enter their name, phone, and email
4. They'll receive notifications when you trigger the panic button

### Can I change my sensory preferences later?
Yes! You can update your sensory preferences anytime in your profile. Changes take effect immediately.

### How do I delete my account?
Contact our support team at neuronav@example.com with your request. Account deletion is permanent.

---

## API & Integration

### Is there an API for developers?
Yes! NeuroNav has a RESTful API. See [API Documentation](./docs/API_DOCUMENTATION.md) for details.

### Can I integrate NeuroNav with my app?
The API is available for integration. Contact us for partnership opportunities.

### What APIs does NeuroNav use?
- Gemini Flash 2.5 (sensory analysis)
- Google Maps (route planning)
- Spotify (music therapy)
- Twilio (SMS notifications)

---

## Troubleshooting

### Why isn't my calm score loading?
- Check your internet connection
- Ensure Gemini API key is configured
- Try refreshing the page
- Contact support if issue persists

### Why aren't caregivers receiving notifications?
- Verify caregiver phone/email is correct
- Check Twilio/Email configuration
- Ensure internet connection is stable
- Check spam/junk folders

### Why is the map not showing routes?
- Verify Google Maps API is enabled
- Check browser location permissions
- Ensure origin and destination are valid
- Try zooming in/out

### Why is my Spotify not connecting?
- Verify Spotify credentials
- Ensure you have an active Spotify account
- Check browser pop-up permissions
- Refresh page and try again

---

## Performance & Optimization

### Why is the app slow?
- Clear browser cache
- Close unnecessary tabs
- Check internet speed
- Disable browser extensions
- Try a different browser

### How can I improve load times?
- Enable caching in browser
- Reduce map zoom level
- Limit history date range
- Use a faster internet connection

---

## Support & Contact

### I found a bug! How do I report it?
1. Go to GitHub Issues
2. Click "New Issue"
3. Describe the bug and steps to reproduce
4. Include screenshots if possible

### How do I request a feature?
1. Go to GitHub Discussions
2. Create a new discussion
3. Describe your feature request
4. Vote on existing requests

### Who do I contact for help?
- **General support**: neuronav@example.com
- **Bug reports**: GitHub Issues
- **Feature requests**: GitHub Discussions
- **Security issues**: security@neuronav.com

### Is there a community forum?
Yes! Join our Discord server for discussions and support from other users.

---

## Liability & Terms

### Is NeuroNav a medical device?
NeuroNav is designed as a support tool, not a medical device. It should not replace professional medical or mental health treatment.

### Can I rely on NeuroNav for emergencies?
While NeuroNav has emergency features, always have a primary emergency contact and don't rely solely on the app for emergencies.

### What's the liability?
NeuroNav is provided as-is. Users assume all responsibility for the use of the application. See Terms of Service for complete legal information.

---

**Last Updated**: February 2026  
**Questions not answered?** Contact neuronav@example.com
