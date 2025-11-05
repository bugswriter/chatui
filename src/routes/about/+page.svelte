<!-- src/routes/about/+page.svelte -->
<script lang="ts">
    import { BrainCircuit, Bot, Zap, Lock } from "lucide-svelte";
</script>

<div class="min-h-screen bg-background text-foreground pt-16">
    <main class="container mx-auto px-4 py-24 sm:py-32">
        <div class="mx-auto max-w-4xl text-center">
            <!-- Header -->
            <h1
                class="text-4xl font-bold tracking-tight text-foreground sm:text-6xl"
            >
                About <span class="text-primary">bw.ai</span>
            </h1>
            <p class="mt-6 text-lg leading-8 text-muted-foreground">
                Our mission is to provide an intelligent, flexible, and secure
                AI assistant that adapts to your workflow, enhancing creativity
                and productivity without compromise.
            </p>
        </div>

        <!-- Core Principles Section -->
        <div class="mx-auto mt-20 max-w-5xl">
            <dl class="grid grid-cols-1 gap-8 md:grid-cols-2">
                <!-- Feature Card 1 -->
                <div
                    class="flex flex-col rounded-xl border border-border bg-muted/30 p-8"
                >
                    <dt
                        class="flex items-center gap-x-3 text-base font-semibold leading-7 text-foreground"
                    >
                        <div
                            class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"
                        >
                            <BrainCircuit class="h-6 w-6 text-primary" />
                        </div>
                        Intelligent & Adaptable
                    </dt>
                    <dd
                        class="mt-4 flex flex-auto flex-col text-base leading-7 text-muted-foreground"
                    >
                        <p class="flex-auto">
                            At the core of our platform is a sophisticated
                            agent-based system. This allows us to create
                            specialized AI assistants that can handle a wide
                            array of tasks, from complex code generation to
                            creative content writing.
                        </p>
                    </dd>
                </div>

                <!-- Feature Card 2 -->
                <div
                    class="flex flex-col rounded-xl border border-border bg-muted/30 p-8"
                >
                    <dt
                        class="flex items-center gap-x-3 text-base font-semibold leading-7 text-foreground"
                    >
                        <div
                            class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"
                        >
                            <Zap class="h-6 w-6 text-primary" />
                        </div>
                        Seamless User Experience
                    </dt>
                    <dd
                        class="mt-4 flex flex-auto flex-col text-base leading-7 text-muted-foreground"
                    >
                        <p class="flex-auto">
                            We believe powerful technology should be intuitive.
                            Our interface is designed to be clean, fast, and
                            responsive, ensuring that your focus remains on your
                            work, not on figuring out the tool.
                        </p>
                    </dd>
                </div>

                <!-- Feature Card 3 -->
                <div
                    class="flex flex-col rounded-xl border border-border bg-muted/30 p-8"
                >
                    <dt
                        class="flex items-center gap-x-3 text-base font-semibold leading-7 text-foreground"
                    >
                        <div
                            class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"
                        >
                            <Lock class="h-6 w-6 text-primary" />
                        </div>
                        Privacy & Security
                    </dt>
                    <dd
                        class="mt-4 flex flex-auto flex-col text-base leading-7 text-muted-foreground"
                    >
                        <p class="flex-auto">
                            Your data is yours. We are committed to robust
                            security practices. All payments are handled
                            securely by Stripe, and our authentication system
                            ensures that your account and conversations remain
                            private.
                        </p>
                    </dd>
                </div>

                <!-- Feature Card 4 -->
                <div
                    class="flex flex-col rounded-xl border border-border bg-muted/30 p-8"
                >
                    <dt
                        class="flex items-center gap-x-3 text-base font-semibold leading-7 text-foreground"
                    >
                        <div
                            class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"
                        >
                            <Bot class="h-6 w-6 text-primary" />
                        </div>
                        Built for the Future
                    </dt>
                    <dd
                        class="mt-4 flex flex-auto flex-col text-base leading-7 text-muted-foreground"
                    >
                        <p class="flex-auto">
                            The AI landscape is constantly evolving, and so are
                            we. Our platform is built on a modern, scalable
                            stack (SvelteKit, FastAPI) that allows us to rapidly
                            integrate new technologies and features.
                        </p>
                    </dd>
                </div>
            </dl>
        </div>
    </main>
</div>
