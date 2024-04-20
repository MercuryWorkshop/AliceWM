class Launcher {
    state: Stateful<{
        active: boolean;
        appsView?: HTMLDivElement;
        search?: HTMLInputElement;
    }> = stateful({
        active: false,
    });

    private popupTransition = "all 0.15s cubic-bezier(0.445, 0.05, 0.55, 0.95)";

    private gridTransition = "all 0.225s cubic-bezier(0.25, 0.46, 0.45, 0.94)";

    css = css`
        position: absolute;
        bottom: 60px;
        left: 10px;
        overflow-y: hidden;
        visibility: hidden;
        z-index: -1;
        opacity: 0;
        transition: ${this.popupTransition};

        .topSearchBar {
            display: flex;
            flex-direction: row;
            padding: 1em;
            align-items: center;
        }

        .topSearchBar img {
            width: 1em;
            height: 1em;
            margin-right: 1em;
        }

        .topSearchBar input {
            font-family: inherit;
            flex-grow: 1;
            background: transparent;
            border: none;
        }

        .recentItemsWrapper {
            padding: 1em;
            font-size: 12px;
            border-top: 1px solid rgb(22 22 22 / 50%);
        }

        .recentItemsWrapper .recentItemsText {
            margin-left: 4em;
            margin-right: 4em;
            color: #fff;
            border-bottom: 1px solid rgb(22 22 22 / 50%);
            padding: 1em 0em;
        }
        /* https://codepen.io/xtrp/pen/QWjREeo */
        ::-webkit-scrollbar {
            width: 20px;
        }

        ::-webkit-scrollbar-track {
            background-color: transparent;
        }

        ::-webkit-scrollbar-thumb {
            background-color: #d6dee1;
            border-radius: 20px;
            border: 6px solid transparent;
            background-clip: content-box;
        }

        ::-webkit-scrollbar-thumb:hover {
            background-color: #a8bbbf;
        }

        .appsView {
            transition: ${this.gridTransition};
            transition-delay: 0.075s;
            padding: 1em;
            font-size: 12px;
            flex-grow: 1;
            display: grid;
            grid-template-columns: 1fr 1fr 1fr 1fr 1fr;
            grid-auto-rows: 8em;
            max-height: calc(5.9 * 8em);
            overflow-y: auto;
            opacity: 0;
            grid-row-gap: 30px;
        }

        .appsView .app {
            display: flex;
            flex-direction: column;
            align-items: center;
            color: #fff;
        }

        .appsView .app input[type="image"] {
            margin-bottom: 0.5em;
        }

        .appsView .app div {
            height: 1em;
        }
    `;

    activeCss = css`
        display: block;
        opacity: 1;
        z-index: 9999;
        visibility: visible;

        .appsView {
            opacity: 1;
            grid-row-gap: 0px;
        }
    `;

    element = (<div>Not Initialized</div>);

    clickoffChecker: HTMLDivElement;
    updateClickoffChecker: (show: boolean) => void;

    handleSearch(event: Event) {
        const searchQuery = (
            event.target as HTMLInputElement
        ).value.toLowerCase();
        if (!this.state.appsView) return;
        const apps = this.state.appsView?.querySelectorAll(".app");

        apps.forEach((app: HTMLElement) => {
            const appNameElement = app.querySelector(".app-shortcut-name");
            if (appNameElement) {
                const appName = appNameElement.textContent?.toLowerCase() || "";
                if (searchQuery === "") {
                    app.style.display = "";
                } else if (appName.includes(searchQuery)) {
                    app.style.display = "";
                } else {
                    app.style.display = "none";
                }
            }
        });
    }

    toggleVisible() {
        this.state.active = !this.state.active;
        this.clearSearch();
    }

    setActive(active: boolean) {
        this.state.active = active;
    }

    hide() {
        this.state.active = false;
        this.clearSearch();
    }

    clearSearch() {
        if (this.state.search) {
            this.state.search.value = "";
        }
        if (!this.state.appsView) return;
        const apps = this.state.appsView?.querySelectorAll(".app");
        apps.forEach((app: HTMLElement) => {
            app.style.display = "";
        });
    }

    addShortcut(app: App) {
        if (app.hidden) return;

        this.state.appsView?.appendChild(
            <LauncherShortcut
                app={app}
                onclick={() => {
                    this.hide();
                    app.open();
                }}
            />,
        );
    }

    constructor(
        clickoffChecker: HTMLDivElement,
        updateClickoffChecker: (show: boolean) => void,
    ) {
        clickoffChecker.addEventListener("click", () => {
            this.state.active = false;
        });

        this.clickoffChecker = clickoffChecker;
        this.updateClickoffChecker = updateClickoffChecker;

        handle(use(this.state.active), updateClickoffChecker);
    }

    async init() {
        const Panel: Component<
            {
                width?: string | DLPointer<any>;
                height?: string | DLPointer<any>;
                margin?: string | DLPointer<any>;
                grow?: boolean;
                style?: any;
                class?: string | (string | DLPointer<any>)[];
                id?: string;
            },
            { children: HTMLElement[] }
        > = await anura.ui.get("Panel");

        this.element = (
            <Panel
                id="launcher"
                width={
                    anura.platform.type == "mobile"
                        ? "calc(min(100%, 65em) - 20px)"
                        : "min(70%, 35em)"
                }
                height={use(this.state.active, (active) =>
                    active
                        ? anura.platform.type == "mobile"
                            ? "min(50%, 25em)"
                            : "min(80%, 40em)"
                        : "min(30%, 20em)",
                )}
                class={[
                    this.css,
                    use(
                        this.state.active,
                        (active) => active && this.activeCss,
                    ),
                ]}
            >
                <div class="topSearchBar">
                    <img src="/icon.png"></img>
                    <input
                        placeholder="Search your tabs, files, apps, and more..."
                        style="outline: none; color: white"
                        bind:this={use(this.state.search)}
                        on:input={this.handleSearch.bind(this)}
                    />
                </div>

                <div
                    id="appsView"
                    class="appsView"
                    bind:this={use(this.state.appsView)}
                ></div>
            </Panel>
        );
    }
}

const LauncherShortcut: Component<
    {
        app: App;
        onclick: () => void;
    },
    Record<string, never>
> = function () {
    return (
        <div class="app" on:click={this.onclick}>
            <input
                class="app-shortcut-image showDialog"
                style="width: 40px; height: 40px"
                type="image"
                src={this.app.icon}
            />
            <div class="app-shortcut-name">{this.app.name}</div>
        </div>
    );
};
