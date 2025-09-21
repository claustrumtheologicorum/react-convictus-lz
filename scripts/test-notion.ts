import 'dotenv/config';
import {Client} from '@notionhq/client';

const notion = new Client({auth: process.env.NOTION_TOKEN});

async function pickDataSourceId(dbId: string) {
  const db: any = await notion.databases.retrieve({database_id: dbId});
  const ds = db?.data_sources?.[0]?.id;
  if (!ds) throw new Error(`No data source under DB ${dbId}`);
  return ds;
}

async function sample(dsId: string, label: string) {
  const res: any = await notion.dataSources.query({
    data_source_id: dsId,
    filter: { and: [{property:'Published', checkbox:{equals:true}}] },
    sorts: [{ timestamp: 'last_edited_time', direction: 'descending' }],
    page_size: 5
  });
  console.log(`\n${label} count:`, res.results.length);
}

(async () => {
  console.log('👋 Authed as:', (await notion.users.me())?.name);

  const newsDs = process.env.NOTION_NEWS_DS
    ?? await pickDataSourceId(process.env.NOTION_NEWS_DB!);
  const infoDs = process.env.NOTION_INFO_DS
    ?? await pickDataSourceId(process.env.NOTION_INFO_DB!);

  await sample(newsDs, 'NEWS');
  await sample(infoDs, 'INFO');
})();
