# Call MCP Tool For Ladder Questions

- Source: Kiro IDE
- Agent: haunted-builder
- Started: 2026-11-14T05:06:25.693Z
- Tool calls: 2
- Credits: 0.25

## Hooks that fired

- agentSpawn-0 (completed): 1
- stop-0 (completed): 1

## Prompt

Call the MCP tool get_ladder_questions from the ladder server with language kk and tell me the first question's title in one line. Do not write any files.

- steering: product.md, safety.md, structure.md, tech.md
- tool `load_resource`: Tool Load {"id":"tool::ladder::get_ladder_questions"}
- tool `tool_call`: @ladder/get_ladder_questions {"tool_id":"tool::ladder::get_ladder_questions","arguments":{"language":"kk"}}
## Kiro

The first question has no separate title field. It is the goal question: «Дәл қазір, өміріңнің осы кезеңінде не қалайсың?» ("What do you want right now, at this stage of your life?").

