import { registerNewUser } from "queries/user";
import { getAccessToken, withApiAuthRequired } from "@auth0/nextjs-auth0";
import { assertNotNil } from "utils/assert";

export default withApiAuthRequired(async function handler(req, res) {
  try {
    const { email } = req.body;
    const { accessToken } = await getAccessToken(req, res);
    if (!assertNotNil(email)) {
      res.status(400).json({ error: "Missing user_id" });
    } else {
      const user_data = await registerNewUser(accessToken, email);
      return res.status(200).json(user_data);
    }
  } catch (error) {
    console.error(error);
    res.status(error.status || 500).json({ msg: error?.code ?? error.message });
  }
});
