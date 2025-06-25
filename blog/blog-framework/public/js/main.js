document.addEventListener('DOMContentLoaded', function () {
    // Scroll-to-top Button
    const scrollButton = document.createElement('button');
    scrollButton.classList.add('scroll-top');
    scrollButton.innerHTML = '&uarr;';
    document.body.appendChild(scrollButton);

    // Zeige Button erst ab bestimmter Scroll-Position
    window.addEventListener('scroll', function () {
        if (window.pageYOffset > 300) {
            scrollButton.classList.add('show');
        } else {
            scrollButton.classList.remove('show');
        }
    });

    // Scroll nach oben bei Klick
    scrollButton.addEventListener('click', function () {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    // Code-Syntax Highlighting mit verbesserter Initialisierung
    if (typeof hljs !== 'undefined') {
        // Registriere alle verfügbaren Sprachen
        hljs.configure({
            languages: ['javascript', 'python', 'bash', 'css', 'html', 'java', 'php', 'json', 'xml', 'markdown']
        });

        // Wende das Highlighting auf alle Code-Blöcke an
        document.querySelectorAll('pre code').forEach((block) => {
            hljs.highlightElement(block);

            // Füge Line-Wrapping hinzu, falls Code zu breit ist
            block.style.whiteSpace = 'pre-wrap';
        });

        console.log('Syntax-Highlighting wurde aktiviert');
    } else {
        console.warn('Highlight.js ist nicht verfügbar - Syntax-Highlighting deaktiviert');
    }

    // Mobile Navigation
    const menuToggle = document.createElement('button');
    menuToggle.classList.add('menu-toggle');
    menuToggle.innerHTML = '&#9776;';

    const navContainer = document.querySelector('header nav');
    navContainer.parentNode.insertBefore(menuToggle, navContainer);

    menuToggle.addEventListener('click', function (e) {
        e.stopPropagation();
        navContainer.classList.toggle('active');
    });

    // Schließe Menü bei Klick außerhalb
    document.addEventListener('click', function (e) {
        if (!navContainer.contains(e.target) && !menuToggle.contains(e.target)) {
            navContainer.classList.remove('active');
        }
    });

    // Verhindere Schließen bei Klick auf das Menü selbst
    navContainer.addEventListener('click', function (e) {
        e.stopPropagation();
    });

    // Aktiven Menüpunkt hervorheben
    const currentPath = window.location.pathname;
    document.querySelectorAll('nav ul li a').forEach(link => {
        if (currentPath === link.getAttribute('href') ||
            (link.getAttribute('href') !== '/blog' && currentPath.includes(link.getAttribute('href')))) {
            link.classList.add('active');
        }
    });

    // Ladezeiten für Bilder verbessern
    document.querySelectorAll('img').forEach(img => {
        img.loading = 'lazy';
    });

    // Background Typewriter Animation
    const coreCode = `// SPDX-License-Identifier: GPL-2.0-only
/*
 *  kernel/sched/core.c
 *
 *  Core kernel CPU scheduler code
 *
 *  Copyright (C) 1991-2002  Linus Torvalds
 *  Copyright (C) 1998-2024  Ingo Molnar, Red Hat
 */
#include <linux/highmem.h>
#include <linux/hrtimer_api.h>
#include <linux/ktime_api.h>
#include <linux/sched/signal.h>
#include <linux/syscalls_api.h>
#include <linux/debug_locks.h>
#include <linux/prefetch.h>
#include <linux/capability.h>
#include <linux/pgtable_api.h>
#include <linux/wait_bit.h>
#include <linux/jiffies.h>
#include <linux/spinlock_api.h>
#include <linux/cpumask_api.h>
#include <linux/lockdep_api.h>
#include <linux/hardirq.h>
#include <linux/softirq.h>
#include <linux/refcount_api.h>
#include <linux/topology.h>
#include <linux/sched/clock.h>
#include <linux/sched/cond_resched.h>
#include <linux/sched/cputime.h>
#include <linux/sched/debug.h>
#include <linux/sched/hotplug.h>
#include <linux/sched/init.h>
#include <linux/sched/isolation.h>
#include <linux/sched/loadavg.h>
#include <linux/sched/mm.h>
#include <linux/sched/nohz.h>
#include <linux/sched/rseq_api.h>
#include <linux/sched/rt.h>

#include <linux/blkdev.h>
#include <linux/context_tracking.h>
#include <linux/cpuset.h>
#include <linux/delayacct.h>
#include <linux/init_task.h>
#include <linux/interrupt.h>
#include <linux/ioprio.h>
#include <linux/kallsyms.h>
#include <linux/kcov.h>
#include <linux/kprobes.h>
#include <linux/llist_api.h>
#include <linux/mmu_context.h>
#include <linux/mmzone.h>
#include <linux/mutex_api.h>
#include <linux/nmi.h>
#include <linux/nospec.h>
#include <linux/perf_event_api.h>
#include <linux/profile.h>
#include <linux/psi.h>
#include <linux/rcuwait_api.h>
#include <linux/rseq.h>
#include <linux/sched/wake_q.h>
#include <linux/scs.h>
#include <linux/slab.h>
#include <linux/syscalls.h>
#include <linux/vtime.h>
#include <linux/wait_api.h>
#include <linux/workqueue_api.h>

static struct task_struct *sched_core_next(struct task_struct *p, unsigned long cookie)
{
    struct rb_node *node = &p->core_node;
    int cpu = task_cpu(p);

    do {
        node = rb_next(node);
        if (!node)
            return NULL;

        p = __node_2_sc(node);
        if (p->core_cookie != cookie)
            return NULL;

    } while (sched_task_is_throttled(p, cpu));

    return p;
}

void update_rq_clock(struct rq *rq)
{
    s64 delta;
    u64 clock;

    lockdep_assert_rq_held(rq);

    if (rq->clock_update_flags & RQCF_ACT_SKIP)
        return;

    if (sched_feat(WARN_DOUBLE_CLOCK))
        WARN_ON_ONCE(rq->clock_update_flags & RQCF_UPDATED);
    rq->clock_update_flags |= RQCF_UPDATED;

    clock = sched_clock_cpu(cpu_of(rq));
    scx_rq_clock_update(rq, clock);

    delta = clock - rq->clock;
    if (delta < 0)
        return;
    rq->clock += delta;

    update_rq_clock_task(rq, delta);
}

static void hrtick_clear(struct rq *rq)
{
    if (hrtimer_active(&rq->hrtick_timer))
        hrtimer_cancel(&rq->hrtick_timer);
}

static enum hrtimer_restart hrtick(struct hrtimer *timer)
{
    struct rq *rq = container_of(timer, struct rq, hrtick_timer);
    struct rq_flags rf;

    WARN_ON_ONCE(cpu_of(rq) != smp_processor_id());

    rq_lock(rq, &rf);
    update_rq_clock(rq);
    rq->donor->sched_class->task_tick(rq, rq->curr, 1);
    rq_unlock(rq, &rf);

    return HRTIMER_NORESTART;
}

void hrtick_start(struct rq *rq, u64 delay)
{
    struct hrtimer *timer = &rq->hrtick_timer;
    s64 delta;

    delta = max_t(s64, delay, 10000LL);
    rq->hrtick_time = ktime_add_ns(timer->base->get_time(), delta);

    if (rq == this_rq())
        __hrtick_restart(rq);
    else
        smp_call_function_single_async(cpu_of(rq), &rq->hrtick_csd);
}

static void resched_curr(struct rq *rq)
{
    struct task_struct *curr = rq->curr;
    int cpu;

    lockdep_assert_rq_held(rq);

    if (test_tsk_need_resched(curr))
        return;

    cpu = cpu_of(rq);
    if (cpu == smp_processor_id()) {
        set_tsk_need_resched(curr);
        set_preempt_need_resched();
        return;
    }

    if (set_nr_and_not_polling(curr))
        smp_send_reschedule(cpu);
    else
        trace_sched_wake_idle_without_ipi(cpu);
}

void wake_up_q(struct wake_q_head *head)
{
    struct wake_q_node *node = head->first;

    while (node != WAKE_Q_TAIL) {
        struct task_struct *task;

        task = container_of(node, struct task_struct, wake_q);
        node = node->next;
        WRITE_ONCE(task->wake_q.next, NULL);

        wake_up_process(task);
        put_task_struct(task);
    }
}

static void update_rq_clock_task(struct rq *rq, s64 delta)
{
    s64 steal = 0, irq_delta = 0;

    if (irqtime_enabled()) {
        irq_delta = irq_time_read(cpu_of(rq)) - rq->prev_irq_time;

        if (irq_delta > delta)
            irq_delta = delta;

        rq->prev_irq_time += irq_delta;
        delta -= irq_delta;
        delayacct_irq(rq->curr, irq_delta);
    }

    rq->clock_task += delta;

    if ((irq_delta + steal) && sched_feat(NONTASK_CAPACITY))
        update_irq_load_avg(rq, irq_delta + steal);
    update_rq_clock_pelt(rq, delta);
}

static inline void raw_spin_rq_lock_nested(struct rq *rq, int subclass)
{
    raw_spinlock_t *lock;

    preempt_disable();
    if (sched_core_disabled()) {
        raw_spin_lock_nested(&rq->__lock, subclass);
        preempt_enable_no_resched();
        return;
    }

    for (;;) {
        lock = __rq_lockp(rq);
        raw_spin_lock_nested(lock, subclass);
        if (likely(lock == __rq_lockp(rq))) {
            preempt_enable_no_resched();
            return;
        }
        raw_spin_unlock(lock);
    }
}`;

    function createBackgroundTypewriter() {
        const bgElement = document.createElement('div');
        bgElement.className = 'background-code';
        bgElement.innerHTML = '';
        document.body.appendChild(bgElement);

        // Start at random position in the code
        let startIndex = Math.floor(Math.random() * (coreCode.length * 0.7)); // Don't start too close to end
        let currentIndex = startIndex;
        const typingSpeed = 25; // Milliseconds per character (even faster)
        const pauseTime = 1500; // Shorter pause before restarting
        const charsToShow = Math.min(2000, coreCode.length - startIndex); // Show up to 2000 characters

        function typeWriter() {
            if (currentIndex < startIndex + charsToShow && currentIndex < coreCode.length) {
                const char = coreCode.charAt(currentIndex);
                bgElement.textContent += char;
                currentIndex++;
                
                // Add typing class for subtle glow effect
                bgElement.classList.add('typing');
                
                setTimeout(typeWriter, typingSpeed);
            } else {
                // Add cursor for a moment
                const cursor = document.createElement('span');
                cursor.className = 'typewriter-cursor';
                cursor.textContent = '|';
                bgElement.appendChild(cursor);
                
                // Remove typing class after a short delay
                setTimeout(() => {
                    bgElement.classList.remove('typing');
                }, 1000);
                
                // Restart with new random position after pause
                setTimeout(() => {
                    startIndex = Math.floor(Math.random() * (coreCode.length * 0.7));
                    currentIndex = startIndex;
                    bgElement.innerHTML = '';
                    console.log(`Starting new cycle at position ${startIndex}`);
                    typeWriter();
                }, pauseTime);
            }
        }

        // Start typing immediately
        console.log(`Starting background typewriter animation at position ${startIndex}...`);
        typeWriter();
    }

    // Initialize background typewriter only on overview pages
    function shouldShowTypewriter() {
        const path = window.location.pathname;
        console.log('Current path:', path);
        
        // Show only on homepage, blog overview, and category pages (not individual posts)
        return path === '/blog' || 
               path === '/blog/' || 
               path === '/blog/overview' ||
               path.startsWith('/blog/category/') ||
               (path === '/' && window.location.hostname.includes('blog'));
    }

    console.log('Should show typewriter:', shouldShowTypewriter());
    
    if (shouldShowTypewriter()) {
        console.log('Creating background typewriter...');
        createBackgroundTypewriter();
    } else {
        console.log('Not showing typewriter on this page (individual post)');
    }
});