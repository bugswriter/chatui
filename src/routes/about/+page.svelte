<!-- src/routes/about/+page.svelte -->
<script lang="ts">
    import { BrainCircuit, Bot, Zap, Lock } from "lucide-svelte";
    // Navbar is now in the layout, so we remove the local import if it existed
</script>

<!-- UNIFIED DESIGN: Consistent use of light background and standard colors -->
<div class="min-h-screen bg-white text-gray-900">
    <main class="container mx-auto px-4 py-24 sm:py-32">
        <div class="mx-auto max-w-3xl">
            <!-- Header -->
            <div class="text-center">
                <h1
                    class="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl"
                >
                    About <span class="text-blue-600">bugswriter.ai</span>
                </h1>
                <p class="mt-6 text-lg leading-8 text-gray-600">
                    Our mission is to provide an intelligent, flexible, and
                    secure AI assistant that adapts to your workflow, enhancing
                    creativity and productivity without compromise.
                </p>
            </div>

            <!-- Core Principles Section -->
            <div class="mt-20">
                <dl
                    class="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-2"
                >
                    <!-- Feature Card 1 -->
                    <div class="flex flex-col">
                        <dt
                            class="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900"
                        >
                            <BrainCircuit
                                class="h-5 w-5 flex-none text-blue-600"
                            />
                            Intelligent & Adaptable
                        </dt>
                        <dd
                            class="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600"
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
                    <div class="flex flex-col">
                        <dt
                            class="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900"
                        >
                            <Zap class="h-5 w-5 flex-none text-blue-600" />
                            Seamless User Experience
                        </dt>
                        <dd
                            class="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600"
                        >
                            <p class="flex-auto">
                                We believe powerful technology should be
                                intuitive. Our interface is designed to be
                                clean, fast, and responsive, ensuring that your
                                focus remains on your work, not on figuring out
                                the tool.
                            </p>
                        </dd>
                    </div>

                    <!-- Feature Card 3 -->
                    <div class="flex flex-col">
                        <dt
                            class="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900"
                        >
                            <Lock class="h-5 w-5 flex-none text-blue-600" />
                            Privacy & Security
                        </dt>
                        <dd
                            class="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600"
                        >
                            <p class="flex-auto">
                                Your data is yours. We are committed to robust
                                security practices. All payments are handled
                                securely by Stripe, and our authentication
                                system ensures that your account and
                                conversations remain private.
                            </p>
                        </dd>
                    </div>

                    <!-- Feature Card 4 -->
                    <div class="flex flex-col">
                        <dt
                            class="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900"
                        >
                            <Bot class="h-5 w-5 flex-none text-blue-600" />
                            Built for the Future
                        </dt>
                        <dd
                            class="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600"
                        >
                            <p class="flex-auto">
                                The AI landscape is constantly evolving, and so
                                are we. Our platform is built on a modern,
                                scalable stack (SvelteKit, FastAPI) that allows
                                us to rapidly integrate new technologies and
                                features.
                            </p>
                        </dd>
                    </div>
                </dl>
            </div>
        </div>
    </main>
</div>
