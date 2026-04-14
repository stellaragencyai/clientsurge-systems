import { useNavigate } from 'react-router-dom';
import { ArrowRight, Calendar } from 'lucide-react';

export default function Book() {
  const navigate = useNavigate();

  const handleBookingComplete = () => {
    navigate('/success');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-3xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-display text-3xl md:text-4xl font-semibold text-foreground mb-4">
            Schedule Your Demo
          </h1>
          <p className="text-muted-foreground text-lg">Pick a time that works best for you</p>
        </div>

        {/* Booking Container */}
        <div className="bg-white rounded-2xl border border-border shadow-lg overflow-hidden">
          {/* Placeholder for calendar embed */}
          <div className="p-8 md:p-12">
            <div className="flex flex-col items-center justify-center py-16 bg-background rounded-xl border border-border/50 border-dashed">
              <Calendar className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center mb-6">
                Calendar integration with Calendly will appear here
              </p>
              {/* For now, show a simple time selection mockup */}
              <div className="w-full max-w-md">
                <p className="text-sm font-semibold text-foreground mb-4 text-center">Available Time Slots</p>
                <div className="grid grid-cols-2 gap-3">
                  {['9:00 AM', '10:00 AM', '11:00 AM', '2:00 PM', '3:00 PM', '4:00 PM'].map(time => (
                    <button
                      key={time}
                      onClick={handleBookingComplete}
                      className="py-3 px-4 border border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-all text-sm font-medium text-foreground"
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="mt-8 p-5 bg-primary/5 border border-primary/15 rounded-xl">
              <p className="text-sm text-foreground/70">
                <span className="font-semibold text-foreground">What to expect:</span> We'll walk through exactly how our system works for your business, answer all your questions, and show you the fastest path to more booked appointments.
              </p>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-sm text-muted-foreground mt-8">
          You'll receive a confirmation email with the meeting details
        </p>
      </div>
    </div>
  );
}