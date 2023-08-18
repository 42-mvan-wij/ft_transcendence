import { ApolloError, gql, useMutation } from "@apollo/client";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

// const USER_ONLINE_CHECK = 4000;
const USER_ONLINE_CHECK = 500;

const USER_IS_ONLINE = gql`
	mutation Mutation {
		userIsOnline
	}
`;

export default function UserIsOnline() {
	const [user_is_online] = useMutation(USER_IS_ONLINE);
	const navigate = useNavigate();

	useEffect(() => {
		const interval = setInterval(() => {
			user_is_online().then(
				() => {
					{
					}
				},
				(error: ApolloError) => {
					navigate("/login");
				}
			);
		}, USER_ONLINE_CHECK);
		return () => clearInterval(interval);
	}, []);

	return;
}
