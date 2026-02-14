import { Link } from "@tanstack/react-router";
import { Button, Flex, Image, Typography } from "antd";
import { useState } from "react";

import reactLogo from "@/assets/react.svg";
import { greet } from "@/utils/greet";
import viteLogo from "/vite.svg";

const { Title, Paragraph, Text } = Typography;

export function IndexPage() {
	const [count, setCount] = useState(0);
	const greeting = greet("World");

	return (
		<Flex vertical align="center" gap="middle">
			<Flex gap="large">
				<a href="https://vite.dev" target="_blank" rel="noopener">
					<Image
						src={viteLogo}
						alt="Vite logo"
						width={100}
						height={100}
						preview={false}
					/>
				</a>
				<a href="https://react.dev" target="_blank" rel="noopener">
					<Image
						src={reactLogo}
						alt="React logo"
						width={100}
						height={100}
						preview={false}
					/>
				</a>
			</Flex>
			<Title>Vite + React + Tanstack Router</Title>
			<Paragraph>{greeting}</Paragraph>
			<Flex vertical align="center" gap="small">
				<Button type="primary" onClick={() => setCount((count) => count + 1)}>
					count is {count}
				</Button>
				<Paragraph>
					Edit <Text code>src/routes/index.tsx</Text> and save to test HMR
				</Paragraph>
			</Flex>

			<Flex gap="middle">
				<Link to="/about">About</Link>
				<Link to="/users">User List</Link>
			</Flex>
			<Text type="secondary">
				Click on the Vite and React logos to learn more
			</Text>
		</Flex>
	);
}
