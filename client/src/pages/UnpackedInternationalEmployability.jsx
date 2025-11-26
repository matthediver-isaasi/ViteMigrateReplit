import React, { useEffect } from "react";

export default function UnpackedInternationalEmployabilityPage() {
  useEffect(() => {
    // Load the CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://static.zohocdn.com/backstage/v1.0/styles/ticket-widget/v1.3/register-widget.min.css';
    document.head.appendChild(link);

    // Load the script
    const script = document.createElement('script');
    script.src = 'https://static.zohocdn.com/backstage/v1.0/javascript/ticket-widget/v1.3/register-widget.min.js';
    script.async = true;
    
    script.onload = () => {
      // Initialize the widget after script loads
      if (window.ZBSCheckOutWidget) {
        window.ZBSCheckOutWidget._createWidget({
          eventUrl: 'https://agcasevents.zohobackstage.eu/embed/international-employability/buyTickets',
          modal: false,
          clickableElements: [],
          ticketClassIdVsSelectorMap: {},
          skipValidation: false,
          widgetOptions: {
            theme: {
              primaryButton: {
                backgroundColor: '#003A1A',
                textColor: '#ffffff',
                borderColor: '#FFFFFF'
              },
              eventHeader: {
                backgroundColor: '#003A1A',
                textColor: '#ffffff'
              }
            },
            visibilityOptions: {
              showEventHeader: true,
              showCheckoutProgress: true,
              showBSBranding: true,
              showEventDate: true,
              showEventVenue: true,
              ticketClassIds: []
            },
            redirectUrl: '',
            affiliate: '',
            promoCode: '',
            showFillInfo: false,
            showRegisterModalWithInfoPage: false,
            messageContents: {
              'lbl.closed': 'closed',
              'lbl.yet.to.start': 'yet to start',
              'lbl.sales.ended': 'sales ended',
              'lbl.unavailable': 'unavailable',
              'lbl.sold.out': 'sold out',
              'lbl.open': 'register now'
            }
          },
          onOrderComplete: function (event) {},
          onClose: function (event) {}
        }, '#zbs-register-widget-section');
      }
    };

    document.body.appendChild(script);

    // Cleanup
    return () => {
      document.head.removeChild(link);
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-green-900 to-emerald-800 text-white py-16 px-4 md:px-8">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-block px-4 py-2 bg-white/10 rounded-full text-sm font-medium mb-4">
            Unpacked Series
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            International Employability
          </h1>
          <p className="text-xl md:text-2xl text-green-100 max-w-3xl mx-auto">
            Join us for an insightful session exploring strategies, challenges, and opportunities in international employability for students and graduates.
          </p>
        </div>
      </div>

      {/* Registration Section */}
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-4 text-center">
              Event Registration
            </h2>
            <p className="text-center text-slate-600 mb-8">
              Secure your place at this exclusive AGCAS event
            </p>
            
            {/* Backstage Embed Widget */}
            <div id='zbs-register-widget-section'></div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm text-slate-600">
            © {new Date().getFullYear()} AGCAS. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}