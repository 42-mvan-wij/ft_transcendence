import { gql } from "@apollo/client";

export const CURRENT_USER = gql`
	query currentUserQuery {
		currentUserQuery {
			username
			avatar {
				file
			}
			id
			twoFAEnabled
		}
	}
`;

export const QR_CODE_QUERY = gql`
	query QRCodeQuery {
		QRCodeQuery
	}
`;
