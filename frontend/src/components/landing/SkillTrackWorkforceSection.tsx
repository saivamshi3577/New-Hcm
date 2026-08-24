import { Award, CheckCircle2, TrendingUp, Sparkles, GraduationCap, Users, ArrowRight } from 'lucide-react'

export function SkillTrackWorkforceSection() {
  const skillFeatures = [
    { title: 'Automated Skill Competency Assessments', desc: 'Conduct role-based online quizzes and technical assessments directly inside the employee portal.' },
    { title: '360° Appraisal Review Workflows', desc: 'Streamline peer, manager, and self-evaluation appraisals with customizable scoring matrices.' },
    { title: 'Workload & Bandwidth Balancing', desc: 'Identify team burnout risks and balance task allocation based on individual member bandwidth.' },
    { title: 'Certified Achievement Badges', desc: 'Reward top performers with digital mastery badges and performance certificates.' },
  ]

  const sampleSkills = [
    { name: 'React & Frontend Architecture', level: 95, tag: 'Expert' },
    { name: 'Node.js & Payroll Calculation Engine', level: 90, tag: 'Advanced' },
    { name: 'Sprint Execution & Task Management', level: 88, tag: 'Advanced' },
    { name: 'Indian Statutory Compliance (PF/ESI)', level: 92, tag: 'Expert' },
  ]

  return (
    <section id="skill-track-section" className="py-14 md:py-16 bg-slate-50/70 text-slate-900 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-indigo-200 text-indigo-800 text-xs font-bold uppercase tracking-wider mb-3 shadow-2xs">
            <GraduationCap className="w-3.5 h-3.5 text-indigo-600" /> Skill Track & Performance Appraisals
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
            Accelerate Employee Growth with Data-Driven Appraisals
          </h2>
          <p className="text-sm sm:text-base text-slate-600">
            Combine daily task velocity with structured skill evaluation tests and quarterly performance appraisal matrices.
          </p>
        </div>

        {/* 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: Skill Feature Points */}
          <div className="lg:col-span-6 space-y-4">
            {skillFeatures.map((item, idx) => (
              <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1 hover:border-indigo-300 transition-all">
                <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>{item.title}</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed pl-6">{item.desc}</p>
              </div>
            ))}

            <div className="pt-2">
              <a
                href="#pricing"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-extrabold text-xs shadow-xs"
              >
                <span>Explore Skill Track in Subscription Plans</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Right Column: Live Skill Matrix Radar Preview */}
          <div className="lg:col-span-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-md space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center border border-indigo-200">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900">Skill Competency Matrix</span>
                    <p className="text-[10px] text-slate-500 font-medium">Employee: Ananya Sharma (Sr. Software Engineer)</p>
                  </div>
                </div>
                <span className="text-[10px] bg-indigo-50 text-indigo-800 border border-indigo-200 px-2 py-0.5 rounded font-extrabold">
                  Overall Score: 91%
                </span>
              </div>

              {/* Skill Bars */}
              <div className="space-y-3">
                {sampleSkills.map((sk, i) => (
                  <div key={i} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1 text-xs">
                    <div className="flex justify-between items-center font-bold text-slate-900">
                      <span>{sk.name}</span>
                      <span className="text-indigo-700 font-black">{sk.level}% ({sk.tag})</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 h-full rounded-full" style={{ width: `${sk.level}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-1 flex items-center justify-between text-[11px] text-slate-500">
                <span className="flex items-center gap-1 font-medium">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Automated Certificate Issued
                </span>
                <span className="font-bold text-indigo-700">Appraisal Ready</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  )
}
