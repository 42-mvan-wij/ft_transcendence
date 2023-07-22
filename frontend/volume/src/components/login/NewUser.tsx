import { useQuery } from "@apollo/client";
import "src/styles/login-pages/new-user.css";
import { CURRENT_USER } from "src/utils/graphQLQueries";
import Loading from "../authorization/Loading";
import ProfileForm from "../settings/ProfileForm";

function NewUser(): JSX.Element {
	const { loading, error, data } = useQuery(CURRENT_USER);

	if (loading) return <Loading />;
	if (error) return <>Error</>;

	return (
		<div className="background">
			<div className="white_block">
				<div className="new_user_content">
					<div className="new_user_header">
						<h1>Welcome to PONG</h1>
						please fill create a username and select a profile picture
					</div>
					<ProfileForm user={data.currentUserQuery} />
				</div>
			</div>
		</div>
	);
}
export default NewUser;
