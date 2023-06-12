import { gql, useQuery } from "@apollo/client";
import { convertEncodedImage } from "src/utils/convertEncodedImage";
import Layout from "./common/Layout";

const AVATAR_QUERY = gql`
	query currentUserQuery {
		currentUserQuery {
			avatar {
				file
				filename
			}
		}
	}
`;

function Settings(): JSX.Element {
	const { loading, error, data } = useQuery(AVATAR_QUERY);

	if (error) {
		console.log(error);
		return <>error</>;
	}
	if (loading) return <>loading</>;

	return (
		<Layout>
			this is the settings page
			<br />
			<img src={convertEncodedImage(data.currentUserQuery.avatar)} alt="error no image" />
		</Layout>
	);
}
export default Settings;
