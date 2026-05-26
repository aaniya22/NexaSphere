/**
 * Generates standardized OpenGraph/SEO metadata for a user portfolio.
 * 
 * @param {Object} userData The fetched portfolio user data
 * @returns {Object} Standardized metadata fields
 */
export function generatePortfolioMeta(userData) {
  const defaultBase = (import.meta?.env?.VITE_API_BASE || window.location.origin).replace(/\/+$/, '');
  
  if (!userData) {
    return {
      title: 'NexaSphere Developer Portfolio',
      description: 'Explore developer portfolios, skills, and projects on NexaSphere.',
      keywords: 'Developer, Portfolio, Projects, NexaSphere',
      author: 'NexaSphere',
      url: window.location.href,
      type: 'website',
      image: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=fallback',
      github: ''
    };
  }

  const { username, title, bio, skills, projects, customProjects, socialLinks, banner, avatar } = userData;
  const name = username ? username : 'Developer';
  const jobTitle = title ? title : 'Tech Specialist & Developer';
  const fullTitle = `${name} | ${jobTitle} Portfolio | NexaSphere`;
  
  // Calculate project count
  const allProjects = [
    ...(projects || []),
    ...(customProjects || [])
  ];
  const projectCount = allProjects.length;
  
  // Generate description based on available data
  let desc = `Explore ${name}'s developer portfolio showcasing`;
  if (skills && skills.length > 0) {
    desc += ` ${skills.slice(0, 3).join(', ')},`;
  }
  if (projectCount > 0) {
    desc += ` ${projectCount} projects,`;
  }
  desc += ` and technical expertise on NexaSphere.`;
  if (bio) {
    desc = `${desc} ${bio.slice(0, 100)}${bio.length > 100 ? '...' : ''}`;
  }

  // Priority: Custom portfolio banner -> User avatar -> Generated fallback banner
  const generatedFallback = `https://api.dicebear.com/7.x/pixel-art/svg?seed=${username || 'fallback'}`;
  let bestImage = banner || avatar || generatedFallback;
  
  // Ensure absolute URLs
  if (bestImage.startsWith('/')) {
    bestImage = `${defaultBase}${bestImage}`;
  }

  // Find keywords
  const keywords = skills && skills.length > 0 ? skills.join(', ') : 'Developer, Portfolio, React, JavaScript, NexaSphere';

  return {
    title: fullTitle,
    description: desc,
    keywords: keywords,
    author: name,
    url: window.location.href,
    type: 'profile',
    image: bestImage,
    github: socialLinks?.github || ''
  };
}
