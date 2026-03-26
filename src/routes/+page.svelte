<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	onMount(() => {
		const stored = localStorage.getItem('asisten_guru_auth');
		goto(stored ? '/dashboard' : '/login');
	});
</script>

<div class="flex min-h-screen items-center justify-center bg-gray-50">
	<p class="text-sm text-gray-400">Memuat...</p>
</div>
