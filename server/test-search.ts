import { imagekit } from './src/config/imagekit';
async function test() {
  const result = await imagekit.listFiles({ searchQuery: 'name="placeholder.apk"' });
  console.log(result);
}
test();
