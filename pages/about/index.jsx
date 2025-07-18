import React from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { 
  Phone, 
  Video, 
  MessageCircle, 
  Star, 
  CheckCircle, 
  ArrowRight, 
  Gem as Crystal, 
  Calendar, 
  Lock, 
  Sparkles,
  Layers
} from "lucide-react";

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common", "services"])),
    },
  };
}

const AboutPage = () => {
  const { t } = useTranslation("common");
  
  return (
    <>
      <Head>
        <title>{t("aboutPageTitle")}</title>
        <meta
          name="description"
          content={t("aboutPageDescription")}
        />
        <meta name="og:title" content={t("aboutPageTitle")} />
        <meta
          name="og:description"
          content={t("aboutPageDescription")}
        />
      </Head>
      
      <Header />
      
      {/* Stunning Hero Section */}
      <section className="relative min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-72 h-72 bg-gradient-to-r from-indigo-400/20 to-purple-400/20 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
          <div className="absolute top-10 right-10 w-72 h-72 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-gradient-to-r from-pink-400/20 to-indigo-400/20 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
        </div>

        {/* Floating Geometric Shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-4 h-4 bg-indigo-500/30 rounded-full animate-float"></div>
          <div className="absolute top-1/3 right-1/3 w-6 h-6 bg-purple-500/30 rounded-full animate-float animation-delay-1000"></div>
          <div className="absolute bottom-1/4 left-1/3 w-3 h-3 bg-pink-500/30 rounded-full animate-float animation-delay-2000"></div>
          <div className="absolute top-1/2 right-1/4 w-5 h-5 bg-indigo-400/30 transform rotate-45 animate-float animation-delay-3000"></div>
        </div>

        {/* Main Hero Content */}
        <div className="relative z-10 container mx-auto px-6 pt-32 pb-20">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center min-h-[600px]">
            
            {/* Left column - Content */}
            <div className="text-center lg:text-left flex flex-col justify-center">
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 backdrop-blur-lg border border-white/30 rounded-full mb-8 shadow-lg mx-auto lg:mx-0 w-fit">
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                <span className="text-indigo-700 font-semibold tracking-wide">{t("aboutMe")}</span>
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse animation-delay-500"></div>
              </div>
              
              <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 mb-6 leading-none">
                Cristina Zurba
              </h1>
              
              <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto lg:mx-0 leading-relaxed font-light mb-8">
                {t("aboutHeroDescription")}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link href="/consultatii" className="group relative px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-2xl transform transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-indigo-500/25 text-decoration-none inline-block">
                  <span className="relative flex items-center gap-3">
                    <Calendar className="w-5 h-5" />
                    {t("scheduleConsultation")}
                  </span>
                </Link>
                
                <Link href="/main-dashboard" className="group px-8 py-4 bg-white/80 backdrop-blur-lg border border-white/30 text-gray-700 font-semibold rounded-2xl transform transition-all duration-300 hover:scale-105 hover:bg-white/90 hover:shadow-xl text-decoration-none inline-block">
                  <span className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5" />
                    {t("exploreServices")}
                  </span>
                </Link>
              </div>
            </div>

            {/* Right column - Hero image */}
            <div className="flex justify-center lg:justify-center items-center">
              <div className="relative">
                <Image src="/icon.png" alt="Cristina Zurba" width={384} height={384} className="w-80 h-80 lg:w-96 lg:h-96 rounded-full border-4 border-white shadow-2xl object-cover relative z-10" />
                {/* Glowing Effect */}
                <div className="absolute inset-0 w-80 h-80 lg:w-96 lg:h-96 bg-gradient-to-r from-indigo-400/30 to-purple-400/30 rounded-full blur-2xl opacity-60 animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Story Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="relative">
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-3xl p-8 shadow-xl">
                <h2 className="text-4xl font-bold text-gray-900 mb-6">{t("myStory")}</h2>
                <p className="text-lg text-gray-600 leading-relaxed mb-6">
                  {t("myJourneyDescription")}
                </p>
                <p className="text-lg text-gray-600 leading-relaxed mb-6">
                  {t("uniqueApproachDescription")}
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                  <span className="text-indigo-600 font-semibold">{t("readingsCompleted")}</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-8">
                             <div className="bg-gradient-to-br from-white/90 to-white/60 backdrop-blur-xl border border-white/30 rounded-2xl p-6 shadow-xl transform hover:scale-105 transition-all duration-300">
                 <div className="flex items-center gap-4 mb-4">
                   <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                     <Star className="w-6 h-6 text-white fill-current" />
                   </div>
                   <h3 className="text-xl font-bold text-gray-900">{t("authenticExperience")}</h3>
                 </div>
                 <p className="text-gray-600">
                   {t("authenticExperienceDescription")}
                 </p>
               </div>
 
               <div className="bg-gradient-to-br from-white/90 to-white/60 backdrop-blur-xl border border-white/30 rounded-2xl p-6 shadow-xl transform hover:scale-105 transition-all duration-300">
                 <div className="flex items-center gap-4 mb-4">
                   <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                     <CheckCircle className="w-6 h-6 text-white" />
                   </div>
                   <h3 className="text-xl font-bold text-gray-900">{t("modernApproach")}</h3>
                 </div>
                 <p className="text-gray-600">
                   {t("modernApproachDescription")}
                 </p>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-24 bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              {t("resultsInNumbers")}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t("transformativeImpactDescription")}
            </p>
          </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
             {[
               { number: "10K+", label: t("readingsPerformed"), icon: <Crystal className="w-10 h-10 text-indigo-600" /> },
               { number: "5⭐", label: t("averageRating"), icon: <Star className="w-10 h-10 text-yellow-500 fill-current" /> },
               { number: "8", label: t("yearsOfExperience"), icon: <Calendar className="w-10 h-10 text-purple-600" /> },
               { number: "100%", label: t("confidentiality"), icon: <Lock className="w-10 h-10 text-pink-600" /> }
             ].map((stat, index) => (
               <div key={index} className="group">
                 <div className="bg-white/80 backdrop-blur-lg border border-white/30 rounded-3xl p-8 text-center shadow-xl transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                   <div className="flex justify-center mb-4">{stat.icon}</div>
                   <div className="text-4xl lg:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-2">
                     {stat.number}
                   </div>
                   <div className="text-gray-600 font-semibold">
                     {stat.label}
                   </div>
                 </div>
               </div>
             ))}
           </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              {t("myServices")}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t("personalizedGuidanceDescription")}
            </p>
          </div>

                     <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             {[
               {
                 title: t("personalizedTarotReadings"),
                 description: t("personalizedTarotDescription"),
                 icon: <Layers className="w-16 h-16 text-indigo-600" />,
                 gradient: "from-indigo-500 to-purple-600"
               },
               {
                 title: t("spiritualConsultations"),
                 description: t("spiritualConsultationsDescription"),
                 icon: <Sparkles className="w-16 h-16 text-purple-600" />,
                 gradient: "from-purple-500 to-pink-600"
               },
               {
                 title: t("futureReadings"),
                 description: t("futureReadingsDescription"),
                 icon: <Crystal className="w-16 h-16 text-pink-600" />,
                 gradient: "from-pink-500 to-indigo-600"
               }
             ].map((service, index) => (
               <div key={index} className="group">
                 <div className="relative h-full bg-gradient-to-br from-white/90 to-white/60 backdrop-blur-xl border border-white/30 rounded-3xl p-8 shadow-xl transform transition-all duration-500 hover:scale-105 hover:shadow-2xl">
                   {/* Floating Elements */}
                   <div className="absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                   
                   <div className="relative z-10">
                     <div className="flex justify-center mb-6">{service.icon}</div>
                     <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">
                       {service.title}
                     </h3>
                     <p className="text-gray-600 leading-relaxed mb-6 text-center">
                       {service.description}
                     </p>
                     <div className="text-center">
                       <button className={`inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r ${service.gradient} text-white font-semibold rounded-2xl transform transition-all duration-300 hover:scale-105 hover:shadow-lg`}>
                         <span>{t("learnMore")}</span>
                         <ArrowRight className="w-4 h-4" />
                       </button>
                     </div>
                   </div>
                   
                   {/* Bottom Accent */}
                   <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${service.gradient} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 rounded-b-3xl`}></div>
                 </div>
               </div>
             ))}
           </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-24 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-64 h-64 bg-gradient-to-r from-indigo-400/10 to-purple-400/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-64 h-64 bg-gradient-to-r from-purple-400/10 to-pink-400/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl lg:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 mb-8">
            {t("startSpiritualJourney")}
          </h2>
          <p className="text-xl text-gray-600 leading-relaxed mb-12 max-w-2xl mx-auto">
            {t("findAnswersDescription")}
          </p>
          
                               <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link href="/consultatii" className="group relative px-10 py-5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold text-lg rounded-2xl transform transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-indigo-500/25 text-decoration-none inline-block">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-700 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <span className="relative flex items-center gap-3 justify-center">
                <Calendar className="w-6 h-6" />
                {t("scheduleConsultation")}
              </span>
            </Link>
            
            <Link href="/main-dashboard" className="group px-10 py-5 bg-white/80 backdrop-blur-lg border border-white/30 text-gray-700 font-bold text-lg rounded-2xl transform transition-all duration-300 hover:scale-105 hover:bg-white/90 hover:shadow-xl text-decoration-none inline-block">
              <span className="flex items-center gap-3 justify-center">
                <Sparkles className="w-6 h-6" />
                {t("exploreServices")}
              </span>
            </Link>
          </div>
      </div>
      </section>

      <Footer />
    </>
  );
};

export default AboutPage;