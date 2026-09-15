import { Star } from "lucide-react"

import { LiquidCard, CardContent } from "@/components/ui/liquid-glass-card"
import { Marquee } from "@/components/ui/marquee"

const testimonials = [
  {
    name: "Alex",
    role: "Computer Science Student",
    content:
      "TalentPortal matched me with an amazing internship at a top tech company perfectly aligned with my skills!",
    avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=200&h=200&auto=format&fit=crop",
    rating: 5,
  },
  {
    name: "Sarah Johnson",
    role: "Technical Recruiter",
    content:
      "This platform has completely changed how we source interns. The AI matching is incredibly accurate and saves us hours.",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&auto=format&fit=crop",
    rating: 5,
  },
  {
    name: "Michael Chen",
    role: "Frontend Developer",
    content:
      "The resume parsing feature is magical. It extracted my entire deep profile perfectly and found matching roles instantly.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&auto=format&fit=crop",
    rating: 5,
  },
  {
    name: "Emily Davis",
    role: "University Administrator",
    content:
      "An excellent tool for our students. It bridges the gap between academic learning and industry requirements flawlessly.",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&auto=format&fit=crop",
    rating: 5,
  },
]


export const Component = () => {
   
  return (
    <div className="w-full">
      <Marquee pauseOnHover>
        {testimonials.map((testimonial, index) => (
          <LiquidCard key={index} className="mx-1 rounded-3xl w-80 h-full">
            <CardContent className="p-6 py-0">
              <div className="mb-4 flex items-center space-x-3">
                <img
                  src={testimonial.avatar || "/placeholder.svg"}
                  alt={testimonial.name}
                  className="h-10 w-10 object-cover rounded-full"
                />
                <div>
                  <h4 className="font-semibold text-slate-900">
                    {testimonial.name}
                  </h4>
                  <p className="text-sm text-slate-500">{testimonial.role}</p>
                </div>
              </div>
              <p className="mb-3 text-slate-700">{testimonial.content}</p>
              <div className="flex space-x-1">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 fill-[#fff200] text-[#fff200]"
                  />
                ))}
              </div>
            </CardContent>
          </LiquidCard>
        ))}
      </Marquee>
    </div>
  );
};
