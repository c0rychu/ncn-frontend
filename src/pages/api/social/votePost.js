import { voteSocialPost } from "queries/social";
import { getAccessToken, withApiAuthRequired } from "@auth0/nextjs-auth0";
import { assertNotNil } from "utils/assert";

export default withApiAuthRequired(async function handler(req, res) {
  try {
    const { post_id, vote_type } = req.body;
    const { accessToken } = await getAccessToken(req, res);
    if (!assertNotNil(post_id) || !assertNotNil(vote_type)) {
      res.status(400).json({ error: "Missing user_id" });
    } else {
      const post_data = await voteSocialPost(accessToken, post_id, vote_type);
      return res.status(200).json(post_data);
    }
  } catch (error) {
    console.error(error);
    res.status(error.status || 500).json({ msg: error?.code ?? error.message });
  }
});
