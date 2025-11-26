import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Target, Award, Heart } from "lucide-react";

export default function PublicAboutPage() {
  const values = [
    {
      icon: Users,
      title: "Community",
      description: "Bringing together careers professionals across UK and Ireland higher education institutions."
    },
    {
      icon: Target,
      title: "Excellence",
      description: "Setting high standards for careers guidance and employability support in higher education."
    },
    {
      icon: Award,
      title: "Innovation",
      description: "Championing best practices and innovative approaches to careers education."
    },
    {
      icon: Heart,
      title: "Support",
      description: "Providing professional development and networking opportunities for our members."
    }
  ];

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">About AGCAS</h1>
          <p className="text-xl text-blue-100 max-w-3xl">
            The Association of Graduate Careers Advisory Services represents careers and employability services in higher education across the UK and Ireland.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="prose prose-lg max-w-none mb-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-6">Our Mission</h2>
          <p className="text-slate-600 text-lg leading-relaxed mb-8">
            AGCAS exists to support career development and employability professionals working in higher education. 
            We provide a platform for professional development, networking, and knowledge sharing that enables our 
            members to deliver outstanding support to students and graduates.
          </p>

          <h2 className="text-3xl font-bold text-slate-900 mb-6">What We Do</h2>
          <p className="text-slate-600 text-lg leading-relaxed mb-8">
            We offer a comprehensive range of services including professional development training, research and 
            best practice guidance, networking events, and advocacy for the careers and employability sector. Our 
            members benefit from access to a supportive community of professionals who share knowledge, resources, 
            and expertise.
          </p>
        </div>

        {/* Values Grid */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">Our Values</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <Card key={index} className="border-slate-200 hover:shadow-lg transition-shadow">
                  <CardContent className="p-6 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                      <Icon className="w-8 h-8 text-blue-600" />
                    </div>
                    <h3 className="font-bold text-lg text-slate-900 mb-2">{value.title}</h3>
                    <p className="text-slate-600 text-sm">{value.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Membership Section */}
        <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl p-8 md:p-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-6">Membership</h2>
          <p className="text-slate-600 text-lg leading-relaxed mb-6">
            AGCAS membership is open to individuals and institutions involved in careers education, information, 
            advice and guidance in higher education. Our members include careers advisers, employability professionals, 
            academics, and other professionals committed to supporting student career development.
          </p>
          <p className="text-slate-600 text-lg leading-relaxed">
            Join a community of over 1,000 careers professionals and gain access to exclusive training events, 
            research publications, networking opportunities, and much more.
          </p>
        </div>
      </div>
    </div>
  );
}