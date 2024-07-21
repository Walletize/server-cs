import * as React from 'react';
import { Html, Button } from "@react-email/components";

export function Email() {
    return (
        <Html lang="en">
            <Button href={"a"}>Click me</Button>
        </Html>
    );
}
