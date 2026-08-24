import { Star, Quote } from 'lucide-react'

export function TestimonialsSection() {
  const testimonials = [
    {
      quote:
        'Switching to FusionHRMS saved our 90-person IT agency over ₹1.2 Lakhs annually compared to our previous HR software. Payroll processing now takes 15 minutes instead of 2 days!',
      name: 'Rohan Mehta',
      title: 'Founder & CEO',
      company: 'Apex Digital Systems, Bengaluru',
      rating: 5,
      members: '90 Members Plan',
    },
    {
      quote:
        'The combination of Task Kanban boards and Indian Statutory Payroll in one single platform is revolutionary. We upgraded from 50 to 100 members seamlessly without any price surprises.',
      name: 'Sneha Kulkarni',
      title: 'Head of People & Culture',
      company: 'Vanguard Tech Solutions, Pune',
      rating: 5,
      members: '100 Members Plan',
    },
    {
      quote:
        'FusionHRMS is hands down the #1 budget-friendly HRMS in India. PDF Payslip generation and direct bank payout export work flawlessly with 100% PF & ESI compliance.',
      name: 'Vikramaditya Rao',
      title: 'Chief Operating Officer',
      company: 'Horizon Logistics, Hyderabad',
      rating: 5,
      members: '200 Members Plan',
    },
  ]


  
  return (
    <section className="py-14 md:py-16 bg-white text-slate-900 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold uppercase tracking-wider mb-3 shadow-2xs">
            <Star className="w-3.5 h-3.5 fill-current text-amber-500" /> Customer Success & Reviews
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
            Trusted by 450+ Indian Companies & HR Leaders
          </h2>
          <p className="text-sm sm:text-base text-slate-600">
            See how organizations across India cut their HR software costs by up to 70% while improving employee productivity.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {testimonials.map((item, idx) => (
            <div
              key={idx}
              className="bg-slate-50/70 border border-slate-200 rounded-2xl p-5 flex flex-col justify-between hover:border-teal-500/40 transition-all shadow-2xs"
            >
              <div>
                {/* Rating stars */}
                <div className="flex items-center space-x-1 text-amber-500 mb-3">
                  {[...Array(item.rating)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                </div>
                <Quote className="w-6 h-6 text-teal-600/30 mb-2" />
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic mb-5">
                  "{item.quote}"
                </p>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900">{item.name}</p>
                  <p className="text-[10px] text-slate-500">{item.title}</p>
                  <p className="text-[10px] text-teal-700 font-semibold">{item.company}</p>
                </div>
                <span className="text-[10px] bg-teal-50 text-teal-800 px-2 py-0.5 rounded font-mono border border-teal-200 font-bold">
                  {item.members}
                </span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
