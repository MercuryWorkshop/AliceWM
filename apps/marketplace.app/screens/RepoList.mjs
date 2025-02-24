function RepoItem() {
	this.mount = async () => {
		try {
			const repo = await marketplace.getRepo(this.repourl, this.reponame);
			this.root.onclick = () => {
				state.currentRepo = [this.reponame, this.repourl, repo];
				state.currentScreen = "itemList";
			};
		} catch (e) {
			this.repoNameElement.innerText += " (Error)";
			this.root.style.color = "red";
			this.root.onclick = () => {
				anura.dialog.alert(
					`Repo ${this.reponame} encountered an error: ${e}`,
					"Repo encountered error.",
				);
			};
		}
	};

	this.css = `
        margin-right: 10px;
        border-radius: 0 9999px 9999px 0;
        margin-left: auto;
        height: 38px;
        line-height: 38px;
        width: auto;
        text-align: left;
        padding-left: 10px;
        color: var(--theme-fg);
        font-weight: 500;
        cursor: pointer;
        transition: background-color 0.1s;
        display: flex;
        align-items: center;

        .material-symbols-outlined {
            margin-right: 10px;
            font-size: 1.4em;
        }
    `;

	const contextMenu = new anura.ContextMenu();
	contextMenu.addItem("Remove", () => {
		saved.repos = saved.repos.filter(([name]) => name !== this.reponame);
	});

	return html`
		<div
			class=${[
				"repoItem",
				use(state.currentRepo, (repo) =>
					(repo || Array(3))[0] === this.reponame ? "selected" : "inactive",
				),
			]}
			on:contextmenu=${(e) => {
				e.preventDefault();

				const rect = frameElement.getBoundingClientRect();
				contextMenu.show(e.pageX + rect.x, e.pageY + rect.y);

				addEventListener(
					"click",
					(e) => {
						e.preventDefault();
						contextMenu.hide();
					},
					{ once: true },
				);
			}}
		>
			<span class="material-symbols-outlined">shopping_bag</span>
			<span bind:this=${use(this.repoNameElement)}>${use(this.reponame)}</span>
		</div>
	`;
}

export default function RepoList() {
	useChange(use(saved.repos), (repos) => {
		this.repos = repos.map(
			([name, url]) => html`<${RepoItem} reponame=${name} repourl=${url} />`,
		);
	});

	this.css = `
        position: fixed;
        width: 30%;
        border-right: 1px solid var(--theme-border);

        // For some reason the & selector is not working right inside RepoItem, so instead we are applying some repoItem styles here

        .repoItem:hover {
            background-color: var(--theme-secondary-bg);
        }

        .repoItem.selected {
            background-color: color-mix(
                in srgb,
                var(--theme-bg) 60%,
                var(--theme-accent) 30%
            );
        }

        .repoAdd > * {
            margin-left: 0.4rem;
            margin-bottom: 0.7rem;
        }

        .repoAdd {
            margin-left: auto;
            margin-right: auto;
            display: table;
            position: fixed;
            bottom: 0;
            margin-top: 20px;

            & > button {
                appearance: none;
                background: var(--theme-secondary-bg);
                color: var(--theme-fg);
                padding: 0;
                border-radius: 50%;
                border: none !important;
                cursor: pointer;
                font-size: 3rem;
                width: 3.5rem;
                height: 3.5rem;
                display: flex;
                align-items: center;
                justify-content: center;

                margin: 1rem;
                transition: 0.2s;
                transform: scale(1);

                box-shadow: 0 0 8px 0px var(--theme-dark-bg);
            }

            & > button:hover {
                background: color-mix(
                    in srgb,
                    var(--theme-bg) 80%,
                    var(--theme-fg)
                );
                transition: 0.2s;
                transform: scale(1.05);
            }

            & > input {
                appearance: none;
                background-color: transparent;
                border: none; /* reset */
                border-style: solid;
                border: 0px solid transparent;
                border-bottom: 2px solid var(--theme-secondary-fg);
                box-shadow: none !important;
                border-style: solid !important;
                margin-right: 5px;
                margin-left: 5px;
                box-shadow: none;
                outline: none;
                color: var(--theme-fg);
            }

            ::-webkit-input-placeholder {
                color: var(--theme-secondary-fg);
            }

            & > input:focus {
                outline: none;
                border-bottom-color: var(--theme-accent);
                transition: 0.2s;
            }

            & > input[type="submit"] {
                background: var(--theme-secondary-bg);
                color: var(--theme-fg);
                padding: 6px;
                border-radius: 6px;
                border: none !important;
                cursor: pointer;
            }

            & > p {
                margin: 0;
                font-size: 10px;
                color: var(--theme-secondary-fg);
            }
        }
    `;

	return html`
		<div>
			<div id="repoScreen">
				<div id="repoList">
					${use(this.repos)}
					<div class="repoAdd">
						<button
							on:click=${async () => {
								let url = await anura.dialog.prompt(
									"Enter the repo URL",
									"https://anura.repo/",
								);
								var name;

								if (!url.endsWith("/")) {
									// anura.dialog.alert("URL does not end with a \"/\" character")
									// return;
									console.warn(
										'URL does not end with a "/" character, this is a user skill issue.',
									);
									url = url + "/";
								}

                                if (!url.startsWith('https://')) {
                                    console.warn(
                                        'URL does not start with "https://", this is a user skill issue'
                                    );
                                    url = 'https://' + url
                                }

                                if (url.includes("github.com") || url.includes("raw.githubusercontent.com")) {
                                    if (!url.startsWith("https://raw.githubusercontent.com/")) {
                                        console.warn(
                                            "URL does not follow https://raw.githubusercontent.com/[user]/[repo]/master/ format, this is a user skill issue.",
                                        );
                                        url = url.split("https://github.com")[1];
                                        url = "https://raw.githubusercontent.com" + url + "master/";
                                    }
    
                                    if (!url.endsWith("master/")) {
                                        console.warn(
                                            'URL does not end with "master/", this is a user skill issue.',
                                        );
                                        url = url + "/master/"
                                    }
                                }

								try {
									let res = await fetch(url + "manifest.json");
									// if (res.status !== 200); throw "Repo missing manifest.json file, this is a repo maintainer skill issue.";
                                    if (res.status !== 200) {
                                        let res = await fetch(url + "list.json")
                                    }
									let json = await res.text();
									json = JSON.parse(json);
									if (!json.name)
										throw "Repo missing name in manifest.json file, this is a repo maintainer skill issue.";
									name = json.name;
								} catch (e) {
									console.error("Error getting repo details: " + e);
									name = await anura.dialog.prompt(
										"Enter the repo name",
										"My awesome repo",
									);
								}

								if (saved.repos.filter(([n]) => n === url).length > 0) {
									anura.dialog.alert("Repo is already added.");
									return;
								} else {
									saved.repos = [...saved.repos, [name, url]];
								}
							}}
						>
							<span class="material-symbols-outlined">add</span>
						</button>
					</div>
				</div>
			</div>
		</div>
	`;
}
