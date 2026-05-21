import PropTypes from "prop-types";
import Head from "next/head";
import Header from "../../components/Header";
import Headline from "../../components/Blog/Headline";
import PostCard from "../../components/Cards/PostCard";
import Sidebar from "../../components/Blog/Sidebar";
import { useState } from "react";
import { useEffect } from "react";
import { Fragment } from "react";
import { handleGetArticles } from "../../utils/realtimeUtils";
import { useRouter } from "next/router";
import { FloatingWhatsApp } from "react-floating-whatsapp";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "next-i18next";
import {
  fetchArticlesPage,
  handleGetFirestore,
  handleQueryFirestore,
} from "../../utils/firestoreUtils";
import HeroFilters from "../../components/Blog/FilterBar/HeroFilters";
import { filterArticlesBeforeCurrentTime } from "../../utils/commonUtils";
import Footer from "../../components/Footer";
import AdSlot from "../../components/Ads/AdSlot";
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";
import { db } from "../../firebase";
import { useAuth } from "../../context/AuthContext";
import { toUrlSlug } from "../../utils/commonUtils";

export async function getServerSideProps({ locale }) {
  // Obținerea datelor articolelor din Firestore
  let PAGE_SIZE = 12;
  console.log("Start fetch...");
  let articlesRef = collection(db, "BlogArticole");
  let q = query(
    articlesRef,
    orderBy("firstUploadTimestamp", "desc"),
    limit(PAGE_SIZE)
  );

  const documentSnapshots = await getDocs(q);
  let articlesData = documentSnapshots.docs.map((doc) => {
    const data = doc.data();
    
    // Function to recursively convert Firestore objects to plain objects
    const convertFirestoreData = (obj) => {
      if (obj === null || obj === undefined) return obj;
      
      // Handle Firestore Timestamps
      if (obj.toDate && typeof obj.toDate === 'function') {
        return obj.toDate().toISOString();
      }
      
      // Handle arrays
      if (Array.isArray(obj)) {
        return obj.map(convertFirestoreData);
      }
      
      // Handle objects
      if (typeof obj === 'object' && obj.constructor === Object) {
        const converted = {};
        for (const [key, value] of Object.entries(obj)) {
          converted[key] = convertFirestoreData(value);
        }
        return converted;
      }
      
      return obj;
    };
    
    return {
      id: doc.id,
      ...convertFirestoreData(data),
    };
  });
  articlesData = filterArticlesBeforeCurrentTime(articlesData);

  const lastVisibleId =
    documentSnapshots.docs.length > 0
      ? documentSnapshots.docs[documentSnapshots.docs.length - 1].id
      : null;

  console.log("Articole...aici...", articlesData.length);
  let articles = {};
  if (articlesData.length > 0) {
    // Sortarea articolelor după data și ora lor
    const sortedArticles = articlesData.sort((a, b) => {
      // Combină data și ora într-un singur string și convertește-le în obiecte de tip Date
      const dateTimeA = new Date(`${a.firstUploadDate} ${a.firstUploadtime}`);
      const dateTimeB = new Date(`${b.firstUploadDate} ${b.firstUploadtime}`);

      // Compară obiectele de tip Date
      return dateTimeB - dateTimeA;
    });

    // Selectarea celor mai noi două articole
    const latestArticles = sortedArticles.slice(0, 2);

    // Selectarea celor mai noi cinci articole
    const latestFiveArticles = sortedArticles.slice(0, 5);

    // Selectarea celui mai nou articol
    const lastArticle = sortedArticles[0]; // Primul articol din lista sortată este cel mai recent

    // Returnarea datelor către componenta Next.js
    articles = {
      articlesData,
      latestArticles,
      lastArticle,
      latestFiveArticles,
    };
  } else {
    articles = {
      articlesData: [],
      latestArticles: [],
      lastArticle: [],
      latestFiveArticles: [],
    };
  }
  return {
    props: {
      articles,
      lastVisibleId,
      ...(await serverSideTranslations(locale, ["common"])),
    },
  };
}

function BlogHome(props) {
  const { t } = useTranslation("common");
  const router = useRouter();
  const detectedLng = router?.locale || 'ro';
  const { currentUser, isGuestUser } = useAuth();
  const { articles } = props;

  // Helper function to generate article URL
  const getArticleUrl = (article) => ({
    pathname: `/news/${toUrlSlug(article.info?.ro?.nume || 'article')}`,
    query: { id: article.id }
  });
  // Removed mobile detection - using Tailwind responsive classes instead

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || "https://cristinazurba.com";

  // In your component
  const currentUrl = `${baseUrl}${router.asPath || ""}`;

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6; // Show 6 articles per page after featured articles

  // Calculate pagination for articles after the featured ones
  const featuredArticlesCount = 3; // Featured + next 2 articles
  const paginatedArticles = articles.articlesData ? articles.articlesData.slice(featuredArticlesCount) : [];
  
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  // Extrage articolele de pe pagina curentă
  const [articlesToDisplay, setArticlesToDisplay] = useState(
    paginatedArticles.slice(startIndex, endIndex)
  );
  const [lastArticle, setLastArticle] = useState(
    articles.lastArticle ? articles.lastArticle : []
  );
  const [latestArticles, setLatestArticles] = useState(
    articles.latestArticles ? articles.latestArticles : []
  );
  const [latestFiveArticles, setLatestFiverArticles] = useState(
    articles.latestFiveArticles ? articles.latestFiveArticles : []
  );

  const [filteredArticles, setFilteredArticles] = useState(
    paginatedArticles
  );

  const [filterItem, setFilterItem] = useState("All");

  const handleNextPage = () => {
    const newStartIndex = currentPage * itemsPerPage;
    if (newStartIndex < filteredArticles.length) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleFilter = async (filterItem) => {
    setFilterItem(filterItem);

    let allArticlesData = [];
    if (filterItem === "All") {
      allArticlesData = articles.articlesData;
    } else {
      allArticlesData = articles.articlesData.filter(
        (article) => article.categorie === filterItem
      );
    }

    // Sortarea articolelor filtrate după data și ora
    const sortedArticles = allArticlesData.sort((a, b) => {
      const dateTimeA = new Date(`${a.firstUploadDate} ${a.firstUploadtime}`);
      const dateTimeB = new Date(`${b.firstUploadDate} ${b.firstUploadtime}`);
      return dateTimeB - dateTimeA;
    });

    // Update the featured sections based on filtered articles
    const newLastArticle = sortedArticles.length > 0 ? sortedArticles[0] : null;
    const newLatestArticles = sortedArticles.length > 1 ? sortedArticles.slice(1, 3) : [];
    const newLatestFiveArticles = sortedArticles.length > 0 ? sortedArticles.slice(0, 5) : [];
    
    setLastArticle(newLastArticle);
    setLatestArticles(newLatestArticles);
    setLatestFiverArticles(newLatestFiveArticles);

    // Update paginated articles for the main grid (excluding featured ones)
    const paginatedFiltered = sortedArticles.slice(featuredArticlesCount);
    setCurrentPage(1);
    setFilteredArticles(paginatedFiltered);
  };

  useEffect(() => {
    const newStartIndex = (currentPage - 1) * itemsPerPage;
    const newEndIndex = newStartIndex + itemsPerPage;
    const newArticlesToDisplay = filteredArticles.slice(
      newStartIndex,
      newEndIndex
    );

    setArticlesToDisplay(newArticlesToDisplay);
  }, [currentPage, filteredArticles]);

  // News page should be accessible to everyone - no authentication required

  return (
    <Fragment>
      <Head>
        <title>News | Cristina Zurba</title>
        <meta
          name="description"
          content="Embark on a journey of self-discovery with Cristina Zurba's News. These tailored readings offer insights into your personal growth, challenges, and potential. Ideal for individuals seeking guidance and deeper understanding of their personal journey."
        />
        <meta property="og:url" content={currentUrl} />
        <meta property="og:title" content="News | Cristina Zurba" />
        <meta
          property="og:description"
          content="Embark on a journey of self-discovery with Cristina Zurba's News. These tailored readings offer insights into your personal growth, challenges, and potential. Ideal for individuals seeking guidance and deeper understanding of their personal journey."
        />
        <meta
          property="og:image"
          content="https://cristinazurba.com/images/social-share.jpg"
        />
        <meta name="format-detection" content="telephone=no" />
      </Head>

      {/* Header */}
      <Header />

      {/* Hero Section with Breadcrumbs */}
      <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Breadcrumbs */}
          <nav className="flex mb-8" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 md:space-x-3">
              <li className="inline-flex items-center">
                <button 
                  onClick={() => router.push("/")}
                  className="inline-flex items-center text-sm font-medium text-white/80 hover:text-white transition-colors duration-300"
                >
                  <svg className="w-3 h-3 mr-2.5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/>
                  </svg>
                  Acasă
                </button>
              </li>
              <li>
                <div className="flex items-center">
                  <svg className="w-6 h-6 text-white/60" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"/>
                  </svg>
                  <span className="ml-1 text-sm font-medium text-white md:ml-2">
                    Blog
                  </span>
                </div>
              </li>
            </ol>
          </nav>

          {/* Hero Content */}
          <div className="text-center">
            <div className="relative inline-block">
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 relative z-10">
                {t("blogAndArticles")}
              </h1>
              <div className="absolute -top-2 -left-4 w-24 h-24 bg-yellow-400/20 rounded-full blur-xl"></div>
              <div className="absolute -bottom-2 -right-4 w-32 h-32 bg-pink-400/20 rounded-full blur-xl"></div>
            </div>
            
            <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-4xl mx-auto leading-relaxed">
              {t("blogHeroDescription")}
            </p>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 max-w-4xl mx-auto">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
                <div className="text-3xl font-bold text-white mb-2">
                  {articles.articlesData ? articles.articlesData.length : 0}+
                </div>
                <div className="text-white/80 font-medium">{t("publishedArticles")}</div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
                <div className="text-3xl font-bold text-white mb-2">5</div>
                <div className="text-white/80 font-medium">{t("diverseCategories")}</div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
                <div className="text-3xl font-bold text-white mb-2">1000+</div>
                <div className="text-white/80 font-medium">{t("monthlyReaders")}</div>
              </div>
            </div>

            {/* Filters integrated in hero */}
            <HeroFilters handleFilter={handleFilter} filterItem={filterItem} />

            {/* Floating Elements */}
            <div className="absolute top-20 left-10 w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full opacity-20 animate-pulse"></div>
            <div className="absolute top-40 right-16 w-16 h-16 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full opacity-30 animate-bounce"></div>
            <div className="absolute bottom-20 left-20 w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full opacity-25 animate-pulse"></div>
          </div>
        </div>
      </div>

      <AdSlot
        slotKey="after-hero"
        className="mx-auto -mt-4 max-w-7xl px-4 sm:px-6 lg:px-8"
      />

      {/* Main Content */}
      <div className="min-h-screen bg-gray-50 pt-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          
          {articles.articlesData.length > 0 ? (
            <>
              {/* Featured Article Section */}
              {lastArticle && (
                <div className="mb-12">
                  <div className="text-center mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                      {t("latestArticle")}
                    </h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                      {t("discoverLatestInsight")}
                    </p>
                  </div>

                  <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden group hover:shadow-xl transition-all duration-300">
                    <div className="grid md:grid-cols-3 gap-0">
                      <div className="relative overflow-hidden">
                        <img
                          src={lastArticle.image?.finalUri}
                          alt={detectedLng === "hi" ? lastArticle.info?.hu?.nume : detectedLng === "id" ? lastArticle.info?.ru?.nume : lastArticle.info?.[detectedLng]?.nume}
                          className="w-full h-56 md:h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"></div>
                      </div>
                      
                      <div className="md:col-span-2 p-6 flex flex-col justify-center">
                        <div className="flex items-center gap-3 mb-4">
                          <span className="px-3 py-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-semibold rounded-full">
                            NOU
                          </span>
                          <span className="text-gray-500 text-sm">
                            {lastArticle.firstUploadDate}
                          </span>
                        </div>
                        
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 leading-tight group-hover:text-indigo-600 transition-colors duration-300">
                          {detectedLng === "hi" ? lastArticle.info?.hu?.nume : detectedLng === "id" ? lastArticle.info?.ru?.nume : lastArticle.info?.[detectedLng]?.nume}
                        </h2>
                        
                        <p className="text-gray-600 leading-relaxed mb-6 line-clamp-3">
                          {detectedLng === "hi" ? lastArticle.info?.hu?.descriere : detectedLng === "id" ? lastArticle.info?.ru?.descriere : lastArticle.info?.[detectedLng]?.descriere}
                        </p>
                        
                        <button 
                          onClick={() => router.push(getArticleUrl(lastArticle))}
                          className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-indigo-600 hover:to-purple-700 transition-all duration-300 hover:scale-105 hover:shadow-lg w-fit"
                        >
                          {t("readArticle")}
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Next 2 Articles Section */}
              {latestArticles && latestArticles.length > 0 && (
                <div className="mb-16">
                  <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
                    {t("recentArticles")}
                  </h2>
                  
                  <div className="grid md:grid-cols-2 gap-8">
                    {latestArticles.map((article, index) => (
                      <div key={index} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden group hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                        <div className="relative overflow-hidden">
                          <img
                            src={article.image?.finalUri}
                            alt={detectedLng === "hi" ? article.info?.hu?.nume : detectedLng === "id" ? article.info?.ru?.nume : article.info?.[detectedLng]?.nume}
                            className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute top-4 left-4">
                            <span className="px-3 py-1 bg-white/90 text-gray-700 text-xs font-semibold rounded-full backdrop-blur-sm">
                              {article.firstUploadDate}
                            </span>
                          </div>
                        </div>
                        
                        <div className="p-6">
                          <h3 className="text-xl font-bold text-gray-900 mb-3 leading-tight group-hover:text-indigo-600 transition-colors duration-300">
                            {detectedLng === "hi" ? article.info?.hu?.nume : detectedLng === "id" ? article.info?.ru?.nume : article.info?.[detectedLng]?.nume}
                          </h3>
                          
                          <p className="text-gray-600 mb-4 line-clamp-3">
                            {detectedLng === "hi" ? article.info?.hu?.descriere : detectedLng === "id" ? article.info?.ru?.descriere : article.info?.[detectedLng]?.descriere}
                          </p>
                          
                          <button 
                            onClick={() => router.push(getArticleUrl(article))}
                            className="inline-flex items-center gap-2 text-indigo-600 font-semibold hover:text-indigo-700 transition-colors duration-300"
                          >
                            {t("readMore")}
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* All Articles Grid with Sidebar for Popular Articles */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Main Articles Grid */}
                <div className="lg:col-span-8">
                  <div className="mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">
                      {t("allArticles")}
                    </h2>
                    <p className="text-gray-600">
                      {t("exploreAllArticles")}
                    </p>
                  </div>
                  <AdSlot
                    slotKey="in-feed"
                    className="mb-8"
                  />

                  {/* Articles Grid */}
                  <div className="grid gap-8 mb-12">
                    {articlesToDisplay.map((article, index) => (
                      <div key={index} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden group hover:shadow-xl transition-all duration-300">
                        <div className="grid md:grid-cols-3 gap-0">
                          <div className="relative overflow-hidden">
                            <img
                              src={article.image?.finalUri}
                              alt={detectedLng === "hi" ? article.info?.hu?.nume : detectedLng === "id" ? article.info?.ru?.nume : article.info?.[detectedLng]?.nume}
                              className="w-full h-48 md:h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          </div>
                          
                          <div className="md:col-span-2 p-6 flex flex-col justify-center">
                            <div className="flex items-center gap-3 mb-4">
                              <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-sm font-semibold rounded-full">
                                {t(article.categorie) || t('General')}
                              </span>
                              <span className="text-gray-500 text-sm">
                                {article.firstUploadDate}
                              </span>
                            </div>
                            
                            <h3 className="text-xl font-bold text-gray-900 mb-3 leading-tight group-hover:text-indigo-600 transition-colors duration-300">
                              {detectedLng === "hi" ? article.info?.hu?.nume : detectedLng === "id" ? article.info?.ru?.nume : article.info?.[detectedLng]?.nume}
                            </h3>
                            
                            <p className="text-gray-600 mb-4 line-clamp-2">
                              {detectedLng === "hi" ? article.info?.hu?.descriere : detectedLng === "id" ? article.info?.ru?.descriere : article.info?.[detectedLng]?.descriere}
                            </p>
                            
                            <button 
                              onClick={() => router.push(getArticleUrl(article))}
                              className="inline-flex items-center gap-2 text-indigo-600 font-semibold hover:text-indigo-700 transition-colors duration-300 w-fit"
                            >
                              {t("readArticle")}
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  <div className="flex justify-center items-center gap-4">
                    <button
                      onClick={handlePrevPage}
                      disabled={currentPage === 1}
                      className={`flex items-center gap-2 px-3 md:px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                        currentPage === 1
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white text-gray-700 hover:bg-gray-50 shadow-md hover:shadow-lg border border-gray-200'
                      }`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/>
                      </svg>
                      <span className="hidden md:inline">{t("previous")}</span>
                    </button>
                    
                    <span className="px-4 py-2 text-gray-600 font-medium">
                      {t("page")} {currentPage}
                    </span>
                    
                    <button
                      onClick={handleNextPage}
                      disabled={endIndex >= filteredArticles.length}
                      className={`flex items-center gap-2 px-3 md:px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                        endIndex >= filteredArticles.length
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg'
                      }`}
                    >
                      <span className="hidden md:inline">{t("next")}</span>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/>
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Sidebar - Only Popular Articles */}
                <div className="lg:col-span-4">
                  <div className="sticky top-24 space-y-8">
                    <Sidebar lastFiveArticles={latestFiveArticles} />
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* No articles message */
            <div className="text-center py-20">
              <div className="max-w-md mx-auto">
                <div className="mb-8">
                  <svg className="mx-auto h-24 w-24 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/>
                  </svg>
                </div>
                                 <h3 className="text-2xl font-bold text-gray-900 mb-4">
                   În curând!
                 </h3>
                 <p className="text-gray-600 text-lg leading-relaxed">
                   Lucrăm la crearea unor conținuturi noi! Revino în curând pentru a citi cele mai recente articole. Între timp, explorează resursele noastre existente.
                 </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </Fragment>
  );
}

export default BlogHome;
