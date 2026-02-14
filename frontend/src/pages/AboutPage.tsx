import { Link } from "@tanstack/react-router";
import { Flex, Typography } from "antd";

const { Title, Paragraph } = Typography;

export function AboutPage() {
	return (
		<Flex vertical align="center" gap="middle" style={{ padding: "2rem" }}>
			<Title level={2}>About Page</Title>
			<Paragraph>
				This is a test page to verify file-based routing with Tanstack Router.
			</Paragraph>
			<Link to="/">Go to Home</Link>
		</Flex>
	);
}
