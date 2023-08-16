// import { useQuery, gql } from "@apollo/client";

// const GET_CHANNELS = gql`
// 	query GetChannels {
// 		currentUserQuery {
// 			id
// 			personal_chats {
// 				id
// 				name
// 				logo
// 				lastMessage {
// 					content
// 					dateSent
// 				}
// 				members {
// 					id
// 					username
// 				}
// 			}
// 			group_chats {
// 				admins {
// 					id
// 				}
// 				banned_users {
// 					id
// 					username
// 					avatar {
// 						file
// 					}
// 				}
// 				id
// 				name
// 				logo
// 				isPublic
// 				owner {
// 					id
// 				}
// 				admins {
// 					id
// 				}
// 				messages {
// 					id
// 					content
// 					author {
// 						id
// 						username
// 						blocked_by_me
// 						avatar {
// 							file
// 						}
// 					}
// 				}
// 				members {
// 					id
// 					username
// 					avatar {
// 						file
// 					}
// 				}
// 			}
// 		}
// 	}
// `;

// export default function useRefetchAllChannels() {
// 	const { loading, data, error, refetch } = useQuery(GET_CHANNELS);

// 	const refetchAllChannels = () => {
// 		refetch();
// 	};

// 	if (!error && !loading && data) return refetchAllChannels;
// 	return null;
// }
