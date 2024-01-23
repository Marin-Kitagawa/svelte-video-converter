<script lang="ts">
	import { tweened } from 'svelte/motion';
	import { fade } from 'svelte/transition';
	import { confetti } from '@neoconfetti/svelte';
	import { FFmpeg } from '@ffmpeg/ffmpeg';
	import { onMount } from 'svelte';
	import {
		Dropdown,
		DropdownItem,
		DropdownMenu,
		DropdownToggle,
		Container,
		Row,
		Col
	} from '@sveltestrap/sveltestrap';

	type State = 'loading' | 'loaded' | 'convert.start' | 'convert.error' | 'convert.done';
	let state: State = 'loading';
	let error = '';
	let ffmpeg: FFmpeg;
	let progress = tweened(0);
	let fileType = 'webm';
	let fileName = '';
    let outputFormat = '';
	let formats = [
		'.webm',
		'.mkv',
		'.flv',
		'.flv',
		'.vob',
		'.ogv',
		'.ogg',
		'.drc',
		'.gif',
		'.gifv',
		'.mng',
		'.avi',
		'.MTS',
		'.M2TS',
		'.TS',
		'.mov',
		'.qt',
		'.wmv',
		'.yuv',
		'.rm',
		'.rmvb',
		'.viv',
		'.asf',
		'.amv',
		'.mp4',
		'.m4p',
		'.m4v',
		'.mpg',
		'.mp2',
		'.mpeg',
		'.mpe',
		'.mpv',
		'.mpg',
		'.mpeg',
		'.m2v',
		'.m4v',
		'.svi',
		'.3gp',
		'.3g2',
		'.mxf',
		'.roq',
		'.nsv',
		'.flv',
		'.f4v',
		'.f4p',
		'.f4a',
		'.f4b'
	];

	async function readFile(file: File): Promise<Uint8Array> {
		return new Promise((resolve) => {
			const fileReader = new FileReader();

			fileReader.onload = () => {
				const { result } = fileReader;
				if (result instanceof ArrayBuffer) {
					resolve(new Uint8Array(result));
				}
			};
			fileReader.onerror = () => {
				error = 'Could not read the file';
			};

			fileReader.readAsArrayBuffer(file);
		});
	}

	async function convertVideo(video: File) {
		state = 'convert.start';
		const videoData = await readFile(video);

		await ffmpeg.writeFile(`input.${fileType}`, videoData);
		await ffmpeg.exec(['-i', `input.${fileType}`, `${fileName}.${outputFormat}`]);
		const data = await ffmpeg.readFile(`${fileName}.${outputFormat}`);

		state = 'convert.done';

		return data as Uint8Array;
	}

	async function handleDrop(event: DragEvent) {
		if (!event.dataTransfer) return;

		if (event.dataTransfer.files.length > 1) {
			error = 'Upload one file';
		}

		let name = event.dataTransfer.files[0].name.split('.');
		fileType = name[name.length - 1];
		name.pop();
		fileName = name.join('.');

		if (event.dataTransfer.files[0].type !== 'video/mp4') {
			error = '';
			const [file] = event.dataTransfer.files;
			const data = await convertVideo(file);
		} else {
			error = 'Converting MP4 files is not supported. You can convert to MP4 instead.';
		}
	}

	async function loadFFmpeg() {
		const baseURL = ' https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';

		ffmpeg = new FFmpeg();

		ffmpeg.on('log', ({ message }) => {
			console.log(message);
		});

        ffmpeg.on('progress', (event) => {
            $progress = event.progress * 100;
        })

		await ffmpeg.load({
			coreURL: `${baseURL}/ffmpeg-core.js`,
			wasmURL: `${baseURL}/ffmpeg-core.wasm`
		});

		state = 'loaded';
	}

	onMount(() => {
		loadFFmpeg();
	});
</script>

<h1 class="title">Convert to MP4</h1>

<Dropdown direction="down">
	<DropdownToggle color="primary" caret>{outputFormat || "Choose the target video format"}</DropdownToggle>
	<DropdownMenu>
		<Container>
			<Row cols={4}>
                {#each formats as format }
                    <Col>
                        <DropdownItem active={format === outputFormat} on:click={() => {outputFormat = format; console.log(outputFormat)}}>{format}</DropdownItem>
                    </Col>
                {/each}
			</Row>
		</Container>
	</DropdownMenu>
</Dropdown>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
	on:drop|preventDefault={handleDrop}
	on:dragover|preventDefault={() => {}}
	data-state={state}
	class="drop"
>
	{#if state === 'loading'}
		<p in:fade>Loading FFmpeg...</p>
	{/if}

	{#if state === 'loaded'}
		<p in:fade>Drag video here</p>
	{/if}

	{#if state === 'convert.start'}
		<p in:fade>Converting video</p>
		<div class="progress-bar">
			<div class="progress" style:--progress="{$progress}%">
				{$progress.toFixed(0)}%
			</div>
		</div>
	{/if}

	{#if state === 'convert.done'}
		<div use:confetti />
		<p in:fade>Done! 🎉</p>
	{/if}

	{#if error}
		<p in:fade class="error">{error}</p>
	{/if}
</div>

<style>
	.title {
		text-align: center;
	}

	.drop {
		width: 600px;
		height: 400px;
		display: grid;
		place-content: center;
		margin-block-start: 2rem;
		border: 10px dashed hsl(220 10% 20%);
		border-radius: 8px;
		& p {
			font-size: 2rem;
			text-align: center;
		}

		& .error {
			color: hsl(9 100% 64%);
		}
	}

	.progress-bar {
		--progress-bar-clr: hsl(180 100% 50%);
		--progress-txt-clr: hsl(0 0% 0%);
		width: 300px;
		height: 40px;
		position: relative;
		font-weight: 700;
		background-color: hsl(200 10% 14%);
		border-radius: 8px;

		& .progress {
			width: var(--progress);
			height: 100%;
			position: absolute;
			left: 0px;
			display: grid;
			place-content: center;
			background-color: var(--progress-bar-clr);
			color: var(--progress-txt-clr);
			border-radius: 8px;
		}
	}
</style>
