import { ApolloError, gql, useMutation } from "@apollo/client";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const USER_ONLINE_CHECK = 1500;

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
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				(error: ApolloError) => {
					navigate("/login");
				}
			);
		}, USER_ONLINE_CHECK);
		return () => clearInterval(interval);
	}, []);

	return;
}
