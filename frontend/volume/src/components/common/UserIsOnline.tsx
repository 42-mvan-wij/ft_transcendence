import { gql, useMutation } from "@apollo/client";
import { useEffect } from "react";
import { USER_TIME_OUT } from "../../../../../backend/volume/src/user/user-activity.service";

const USER_IS_ONLINE = gql`
	mutation Mutation {
		userIsOnline
	}
`;

export default function UserIsOnline() {
	const [user_is_online, { data, loading, error }] = useMutation(USER_IS_ONLINE);

	useEffect(() => {
		const interval = setInterval(() => {
			user_is_online();
		}, USER_TIME_OUT / 2 - 100);
		return () => clearInterval(interval);
	}, []);
	return;
}
