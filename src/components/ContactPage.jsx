import React, { useState } from "react";
import { contactPageStyles } from "../assets/dummyStyles";
import { 
  User, Mail, Phone, MapPin, Stethoscope, 
  MessageSquare, Send, Clock, Globe 
} from "lucide-react";

const ContactPage = () => {
  const initial = {
    name: "",
    email: "",
    phone: "",
    department: "",
    service: "",
    message: "",
  };

  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState({});
  const [sent, setSent] = useState(false);

  const departments = [
    "General Physician",
    "Cardiology",
    "Orthopedics",
    "Dermatology",
    "Pediatrics",
    "Gynecology",
  ];

  const servicesMapping = {
    "General Physician": ["General Consultation", "Adult Checkup", "Vaccination", "Health Screening"],
    "Cardiology": ["ECG", "Echocardiography", "Stress Test", "Heart Consultation"],
    "Orthopedics": ["Fracture Care", "Joint Pain Consultation", "Physiotherapy"],
    "Dermatology": ["Skin Consultation", "Allergy Test", "Acne Treatment"],
    "Pediatrics": ["Child Checkup", "Vaccination (Child)", "Growth Monitoring"],
    "Gynecology": ["Antenatal Care", "Pap Smear", "Ultrasound"],
  };

  const genericServices = [
    "General Consultation", "ECG", "Blood Test", "X-Ray", "Ultrasound", "Physiotherapy", "Vaccination"
  ];

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = "Full name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Enter a valid email";
    
    if (!form.phone.trim()) e.phone = "Phone number is required";
    else if (!/^[0-9]{10}$/.test(form.phone)) e.phone = "Phone number must be exactly 10 digits";

    if (!form.department && !form.service) {
      e.department = "Please choose a department or service";
      e.service = "Please choose a department or service";
    }

    if (!form.message.trim()) e.message = "Please write a short message";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleChange(e) {
    const { name, value } = e.target;
    if (name === "department") {
      setForm((prev) => ({ ...prev, department: value, service: "" }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    const text = `*Contact Request*\nName: ${form.name}\nEmail: ${form.email}\nPhone: ${form.phone}\nDepartment: ${form.department || "N/A"}\nService: ${form.service || "N/A"}\nMessage: ${form.message}`;
    const url = `https://wa.me/8299431275?text=${encodeURIComponent(text)}`;
    
    window.open(url, "_blank");
    setForm(initial);
    setErrors({});
    setSent(true);
    setTimeout(() => setSent(false), 4000);
  }

  const availableServices = form.department ? servicesMapping[form.department] || [] : genericServices;

  return (
    <div className={contactPageStyles.pageContainer}>
      <style>{contactPageStyles.animationKeyframes}</style>
      
      {/* Accents d'arrière-plan */}
      <div className={contactPageStyles.bgAccent1}></div>
      <div className={contactPageStyles.bgAccent2}></div>

      <div className={contactPageStyles.gridContainer}>
        
        {/* COLONNE 1 : FORMULAIRE */}
        <div className={contactPageStyles.formContainer}>
          <h2 className={contactPageStyles.formTitle}>Contact Our Clinic</h2>
          <p className={contactPageStyles.formSubtitle}>
            Fill the form - we'll open WhatsApp so you can connect with us instantly.
          </p>

          <form onSubmit={handleSubmit} className={contactPageStyles.formSpace}>
            <div className={contactPageStyles.formGrid}>
              <div>
                <label className={contactPageStyles.label}><User size={16} /> Full Name</label>
                <input name="name" value={form.name} onChange={handleChange} placeholder="John Doe" className={contactPageStyles.input} />
                {errors.name && <p className={contactPageStyles.error}>{errors.name}</p>}
              </div>

              <div>
                <label className={contactPageStyles.label}><Mail size={16} /> Email Address</label>
                <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="example@mail.com" className={contactPageStyles.input} />
                {errors.email && <p className={contactPageStyles.error}>{errors.email}</p>}
              </div>
            </div>

            <div className={contactPageStyles.formGrid}>
              <div>
                <label className={contactPageStyles.label}><Phone size={16} /> Phone Number</label>
                <input name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="1234567890" className={contactPageStyles.input} maxLength="10" />
                {errors.phone && <p className={contactPageStyles.error}>{errors.phone}</p>}
              </div>

              <div>
                <label className={contactPageStyles.label}><MapPin size={16} /> Department</label>
                <select name="department" value={form.department} onChange={handleChange} className={contactPageStyles.input}>
                  <option value="">Select Department</option>
                  {departments.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
                {errors.department && <p className={contactPageStyles.error}>{errors.department}</p>}
              </div>
            </div>

            <div>
              <label className={contactPageStyles.label}><Stethoscope size={16} /> Service</label>
              <select name="service" value={form.service} onChange={handleChange} className={contactPageStyles.input}>
                <option value="">Select Service</option>
                {availableServices.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              {errors.service && <p className={contactPageStyles.error}>{errors.service}</p>}
            </div>

            <div>
              <label className={contactPageStyles.label}><MessageSquare size={16} /> Message</label>
              <textarea name="message" value={form.message} onChange={handleChange} placeholder="How can we help you?" className={contactPageStyles.textarea} rows="4" />
              {errors.message && <p className={contactPageStyles.error}>{errors.message}</p>}
            </div>

            <div className={contactPageStyles.buttonContainer}>
              <button type="submit" className={contactPageStyles.button}>
                <Send size={18} /> Send to WhatsApp
              </button>
              {sent && <p className={contactPageStyles.sentMessage}>Redirecting to WhatsApp...</p>}
            </div>
          </form>
        </div>

        {/* COLONNE 2 : INFOS & CARTE */}
        <div className={contactPageStyles.infoContainer}>
          <div className={contactPageStyles.infoCard}>
            <h3 className={`${contactPageStyles.infoTitle} text-emerald-800`}>Visit Our Clinic</h3>
            <p className={`${contactPageStyles.infoText} text-gray-600`}>We provide top-tier medical care with a focus on patient comfort.</p>
            
            <div className={contactPageStyles.infoItem}><MapPin className="text-emerald-600" size={20}/> 123 Medical Drive, Health City</div>
            <div className={contactPageStyles.infoItem}><Phone className="text-emerald-600" size={20}/> +91 8299431275</div>
            <div className={contactPageStyles.infoItem}><Globe className="text-emerald-600" size={20}/> www.emeraldclinic.com</div>
          </div>

          <div className={contactPageStyles.hoursContainer}>
            <h4 className={`${contactPageStyles.hoursTitle} text-emerald-900`}><Clock size={18} className="inline mr-2"/> Working Hours</h4>
            <div className="flex justify-between text-sm mt-2">
              <span>Mon - Sat:</span>
              <span className="font-bold text-emerald-800">09:00 AM - 08:00 PM</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span>Sunday:</span>
              <span className="text-rose-600 font-bold">Emergency Only</span>
            </div>
          </div>

          <div className={contactPageStyles.map}>
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3502.562064610214!2d77.2090!3d28.6139!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjjCsDM2JzUwLjAiTiA3N8KwMTInMzIuNCJF!5e0!3m2!1sen!2sin!4v1631234567890!5m2!1sen!2sin" 
              width="100%" height="100%" style={{ border: 0, borderRadius: '24px' }} allowFullScreen="" loading="lazy">
            </iframe>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ContactPage;