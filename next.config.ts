// next.config.ts
import createNextIntlPlugin from 'next-intl/plugin';
import type {NextConfig} from 'next';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
    images: {
        remotePatterns: [
            { protocol: 'https', hostname: '**.amazonaws.com', pathname: '/**' },
            { protocol: 'https', hostname: 'images.notion.so', pathname: '/**' }
        ]
    }

  }


export default withNextIntl(nextConfig);
