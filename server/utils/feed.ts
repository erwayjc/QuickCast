import { Feed } from 'feed';
import { type Episode } from '@shared/schema';

interface FeedConfig {
  title: string;
  description: string;
  id: string;
  link: string;
  language?: string;
  image?: string;
  author: {
    name: string;
    email?: string;
    link?: string;
  };
}

export function generatePodcastFeed(episodes: Episode[], config: FeedConfig) {
  const feed = new Feed({
    title: config.title,
    description: config.description,
    id: config.id,
    link: config.link,
    language: config.language || 'en',
    image: config.image,
    favicon: config.image,
    copyright: `All rights reserved ${new Date().getFullYear()}`,
    author: config.author
  });

  episodes
    .filter(episode => episode.status === 'published')
    .sort((a, b) => {
      const dateA = a.publishDate ? new Date(a.publishDate).getTime() : 0;
      const dateB = b.publishDate ? new Date(b.publishDate).getTime() : 0;
      return dateB - dateA;
    })
    .forEach(episode => {
      feed.addItem({
        title: episode.title,
        id: episode.id.toString(),
        link: `${config.link}/episodes/${episode.id}`,
        description: episode.description,
        date: episode.publishDate ? new Date(episode.publishDate) : new Date(episode.createdAt),
        enclosure: {
          url: episode.audioUrl,
          length: 0, // This should be the file size in bytes
          type: 'audio/mpeg'
        },
        image: episode.artworkUrl || config.image,
        ...(episode.keywords && { category: episode.keywords.map(k => ({ name: k })) })
      });
    });

  return feed.rss2();
}
